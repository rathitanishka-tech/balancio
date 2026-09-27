import { Types } from "mongoose";
import { groupRepository } from "../repositories/group.repository";
import { userRepository } from "../repositories/user.repository";
import { NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors";
import { CreateGroupInput, UpdateGroupInput } from "../types/group.types";
import { IGroup } from "../models/Group";
import { activityService } from "./activity.service";

export const groupService = {
  async createGroup(ownerId: string, input: CreateGroupInput): Promise<IGroup> {
    const group = await groupRepository.create({
      name: input.name,
      description: input.description,
      image: input.image,
      currency: input.currency ?? "INR",
      ownerId: new Types.ObjectId(ownerId) as unknown as IGroup["ownerId"]
    });

    await groupRepository.addMember(group._id.toString(), ownerId, "OWNER");
    await activityService.record(group._id.toString(), ownerId, "group_created", { name: group.name });

    return group;
  },

  async listGroupsForUser(userId: string): Promise<IGroup[]> {
    const memberships = await groupRepository.listGroupsForUser(userId);
    const groupIds = memberships.map((m) => m.groupId);
    if (groupIds.length === 0) return [];
    const groups = await Promise.all(groupIds.map((id) => groupRepository.findById(id.toString())));
    return groups.filter((g): g is IGroup => g !== null);
  },

  async getGroup(groupId: string, userId: string): Promise<IGroup> {
    const group = await groupRepository.findById(groupId);
    if (!group) throw new NotFoundError("Group");

    const membership = await groupRepository.findMembership(groupId, userId);
    if (!membership) throw new UnauthorizedError("You are not a member of this group");

    return group;
  },

  async updateGroup(groupId: string, userId: string, input: UpdateGroupInput): Promise<IGroup> {
    // Authorization (admin/owner) is enforced by requireAdmin route middleware;
    // this defensive check also protects any future non-HTTP callers.
    const membership = await groupRepository.findMembership(groupId, userId);
    if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
      throw new UnauthorizedError("Only group admins or the owner can update this group");
    }

    const group = await groupRepository.updateById(groupId, input);
    if (!group) throw new NotFoundError("Group");

    await activityService.record(groupId, userId, "group_updated", { changes: input });
    return group;
  },

  async deleteGroup(groupId: string, userId: string): Promise<void> {
    const membership = await groupRepository.findMembership(groupId, userId);
    if (!membership || membership.role !== "OWNER") {
      throw new UnauthorizedError("Only the group owner can delete this group");
    }
    await groupRepository.deleteById(groupId);
  },

  async searchGroupsForUser(userId: string, query: string): Promise<IGroup[]> {
    const memberships = await groupRepository.listGroupsForUser(userId);
    const myGroupIds = new Set(memberships.map((m) => m.groupId.toString()));
    const results = await groupRepository.searchByText(query);
    return results.filter((g) => myGroupIds.has(g._id.toString()));
  }
};

export async function ensureUserExistsByEmail(email: string) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new ValidationError(`No user found with email ${email}`);
  }
  return user;
}
