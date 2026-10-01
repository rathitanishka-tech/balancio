import { getUserGroups, createGroup, updateGroup, deleteGroup, addGroupMember, removeGroupMember } from "@/lib/actions/groups";
import type { Activity, CreateGroupPayload, Group, GroupMember, UpdateGroupPayload } from "@/types/group";

export const groupsApi = {
  async list(): Promise<Group[]> {
    const data = await getUserGroups();
    return data as unknown as Group[];
  },

  async get(groupId: string): Promise<Group> {
    const data = await getUserGroups();
    const group = data.find(g => g.id === groupId);
    if (!group) throw new Error("Group not found");
    return group as unknown as Group;
  },

  async create(payload: CreateGroupPayload): Promise<Group> {
    const group = await createGroup(payload);
    return group as unknown as Group;
  },

  async update(groupId: string, payload: UpdateGroupPayload): Promise<Group> {
    const group = await updateGroup(groupId, payload);
    return group as unknown as Group;
  },

  async remove(groupId: string): Promise<void> {
    await deleteGroup(groupId);
  },

  async activity(groupId: string): Promise<Activity[]> {
    return [];
  },

  async listMembers(groupId: string): Promise<GroupMember[]> {
    const data = await getUserGroups();
    const group = data.find(g => g.id === groupId);
    return (group?.members ?? []) as unknown as GroupMember[];
  },

  async addMember(groupId: string, email: string, role?: "ADMIN" | "MEMBER"): Promise<void> {
    await addGroupMember(groupId, email, role);
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    await removeGroupMember(groupId, userId);
  },

  async updateMemberRole(groupId: string, userId: string, role: "OWNER" | "ADMIN" | "MEMBER"): Promise<void> {
    // skip
  },

  async invite(groupId: string, email: string): Promise<void> {
    await addGroupMember(groupId, email, "MEMBER");
  }
};
