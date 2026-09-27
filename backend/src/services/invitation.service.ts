import { Invitation, IInvitation } from "../models/Invitation";
import { groupRepository } from "../repositories/group.repository";
import { userRepository } from "../repositories/user.repository";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors";
import { notificationService } from "./notification.service";
import { activityService } from "./activity.service";

export const invitationService = {
  async createInvitation(groupId: string, invitedBy: string, email: string): Promise<IInvitation> {
    const group = await groupRepository.findById(groupId);
    if (!group) throw new NotFoundError("Group");

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      const alreadyMember = await groupRepository.findMembership(groupId, existingUser._id.toString());
      if (alreadyMember) {
        throw new ConflictError("This user is already a member of the group");
      }
    }

    const existingPending = await Invitation.findOne({
      groupId,
      email: normalizedEmail,
      status: "PENDING"
    });
    if (existingPending) {
      throw new ConflictError("An invitation to this email is already pending");
    }

    const invitation = await Invitation.create({ groupId, invitedBy, email: normalizedEmail });

    if (existingUser) {
      await notificationService.notify({
        userId: existingUser._id.toString(),
        type: "INVITED",
        title: "You've been invited to a group",
        message: `You have been invited to join "${group.name}".`,
        relatedGroupId: groupId
      });
    }

    return invitation;
  },

  async listForGroup(groupId: string, status?: string): Promise<IInvitation[]> {
    const query: Record<string, unknown> = { groupId };
    if (status) query.status = status;
    return Invitation.find(query).sort({ createdAt: -1 });
  },

  async respond(token: string, userId: string, action: "ACCEPT" | "DECLINE"): Promise<IInvitation> {
    const invitation = await Invitation.findOne({ token });
    if (!invitation) throw new NotFoundError("Invitation");

    if (invitation.status !== "PENDING") {
      throw new ValidationError(`This invitation has already been ${invitation.status.toLowerCase()}`);
    }
    if (invitation.expiresAt.getTime() < Date.now()) {
      invitation.status = "EXPIRED";
      await invitation.save();
      throw new ValidationError("This invitation has expired");
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User");
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new UnauthorizedError("This invitation was sent to a different email address");
    }

    if (action === "DECLINE") {
      invitation.status = "DECLINED";
      await invitation.save();
      return invitation;
    }

    const alreadyMember = await groupRepository.findMembership(
      invitation.groupId.toString(),
      userId
    );
    if (!alreadyMember) {
      await groupRepository.addMember(invitation.groupId.toString(), userId, "MEMBER");
      await activityService.record(invitation.groupId.toString(), userId, "member_added", { userId });
    }

    invitation.status = "ACCEPTED";
    await invitation.save();
    return invitation;
  }
};
