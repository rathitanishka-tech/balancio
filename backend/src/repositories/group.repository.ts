import { Types } from "mongoose";
import { Group, IGroup } from "../models/Group";
import { GroupMember, IGroupMember, GroupRole } from "../models/GroupMember";

export const groupRepository = {
  async create(data: Partial<IGroup>): Promise<IGroup> {
    return Group.create(data);
  },

  async findById(groupId: string): Promise<IGroup | null> {
    if (!Types.ObjectId.isValid(groupId)) return null;
    return Group.findById(groupId);
  },

  async updateById(groupId: string, data: Partial<IGroup>): Promise<IGroup | null> {
    return Group.findByIdAndUpdate(groupId, data, { new: true, runValidators: true });
  },

  async deleteById(groupId: string): Promise<void> {
    await Group.findByIdAndDelete(groupId);
  },

  async searchByText(query: string, limit = 10): Promise<IGroup[]> {
    const regex = new RegExp(escapeRegex(query), "i");
    return Group.find({ $or: [{ name: regex }, { description: regex }] }).limit(limit);
  },

  // --- Membership ---------------------------------------------------

  async addMember(groupId: string, userId: string, role: GroupRole): Promise<IGroupMember> {
    return GroupMember.create({ groupId, userId, role });
  },

  async findMembership(groupId: string, userId: string): Promise<IGroupMember | null> {
    if (!Types.ObjectId.isValid(groupId) || !Types.ObjectId.isValid(userId)) return null;
    return GroupMember.findOne({ groupId, userId });
  },

  async listMembers(groupId: string): Promise<IGroupMember[]> {
    return GroupMember.find({ groupId }).sort({ joinedAt: 1 });
  },

  async listMemberIds(groupId: string): Promise<string[]> {
    const members = await GroupMember.find({ groupId }).select("userId");
    return members.map((m) => m.userId.toString());
  },

  async listGroupsForUser(userId: string): Promise<IGroupMember[]> {
    return GroupMember.find({ userId });
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    await GroupMember.findOneAndDelete({ groupId, userId });
  },

  async updateMemberRole(groupId: string, userId: string, role: GroupRole): Promise<IGroupMember | null> {
    return GroupMember.findOneAndUpdate({ groupId, userId }, { role }, { new: true });
  },

  async countOwners(groupId: string): Promise<number> {
    return GroupMember.countDocuments({ groupId, role: "OWNER" });
  }
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
