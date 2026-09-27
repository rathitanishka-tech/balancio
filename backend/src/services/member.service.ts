import { groupRepository } from "../repositories/group.repository";
import { userRepository } from "../repositories/user.repository";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors";
import { IGroupMember, GroupRole } from "../models/GroupMember";
import { activityService } from "./activity.service";
import { notificationService } from "./notification.service";

export const memberService = {
  async listMembers(groupId: string): Promise<{ member: IGroupMember; name: string; email: string }[]> {
    const members = await groupRepository.listMembers(groupId);
    const users = await userRepository.findByIds(members.map((m) => m.userId));
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    return members.map((m) => {
      const user = userMap.get(m.userId.toString());
      return { member: m, name: user?.name ?? "Unknown", email: user?.email ?? "" };
    });
  },

  /**
   * Directly adds an EXISTING user (looked up by email) to a group. This
   * is distinct from the token-based invitation flow (invitation.service.ts)
   * which also works for people who don't have an account yet.
   */
  async addMemberByEmail(groupId: string, actorId: string, email: string, role: GroupRole = "MEMBER") {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ValidationError(
        `No account found for ${email}. Send an invitation instead so they can sign up.`
      );
    }

    const existing = await groupRepository.findMembership(groupId, user._id.toString());
    if (existing) {
      throw new ConflictError("This user is already a member of the group");
    }

    const member = await groupRepository.addMember(groupId, user._id.toString(), role);
    await activityService.record(groupId, actorId, "member_added", { userId: user._id.toString() });
    await notificationService.notify({
      userId: user._id.toString(),
      type: "JOINED_GROUP",
      title: "You were added to a group",
      message: `You have been added to a new group.`,
      relatedGroupId: groupId
    });

    return member;
  },

  async removeMember(groupId: string, actorId: string, targetUserId: string): Promise<void> {
    const target = await groupRepository.findMembership(groupId, targetUserId);
    if (!target) throw new NotFoundError("Group member");

    if (target.role === "OWNER") {
      throw new UnauthorizedError("The group owner cannot be removed. Transfer ownership first.");
    }

    await groupRepository.removeMember(groupId, targetUserId);
    await activityService.record(groupId, actorId, "member_removed", { userId: targetUserId });
  },

  async updateMemberRole(
    groupId: string,
    actorId: string,
    targetUserId: string,
    role: GroupRole
  ): Promise<IGroupMember> {
    const actorMembership = await groupRepository.findMembership(groupId, actorId);
    if (!actorMembership || actorMembership.role !== "OWNER") {
      throw new UnauthorizedError("Only the group owner can change member roles");
    }

    if (targetUserId === actorId && role !== "OWNER") {
      const ownerCount = await groupRepository.countOwners(groupId);
      if (ownerCount <= 1) {
        throw new ValidationError("A group must always have at least one owner");
      }
    }

    const updated = await groupRepository.updateMemberRole(groupId, targetUserId, role);
    if (!updated) throw new NotFoundError("Group member");
    return updated;
  }
};
