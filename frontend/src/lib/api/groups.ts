import { apiRequest } from "@/lib/api/client";
import type { Activity, CreateGroupPayload, Group, GroupMember, UpdateGroupPayload } from "@/types/group";

export const groupsApi = {
  async list(): Promise<Group[]> {
    const { groups } = await apiRequest<{ groups: Group[] }>("/groups");
    return groups;
  },

  async get(groupId: string): Promise<Group> {
    const { group } = await apiRequest<{ group: Group }>(`/groups/${groupId}`);
    return group;
  },

  async create(payload: CreateGroupPayload): Promise<Group> {
    const { group } = await apiRequest<{ group: Group }>("/groups", { method: "POST", body: payload });
    return group;
  },

  async update(groupId: string, payload: UpdateGroupPayload): Promise<Group> {
    const { group } = await apiRequest<{ group: Group }>(`/groups/${groupId}`, {
      method: "PATCH",
      body: payload
    });
    return group;
  },

  async remove(groupId: string): Promise<void> {
    await apiRequest<void>(`/groups/${groupId}`, { method: "DELETE" });
  },

  async activity(groupId: string): Promise<Activity[]> {
    const { activity } = await apiRequest<{ activity: Activity[] }>(`/groups/${groupId}/activity`);
    return activity;
  },

  // --- Members ------------------------------------------------------------

  async listMembers(groupId: string): Promise<GroupMember[]> {
    const { members } = await apiRequest<{ members: GroupMember[] }>(`/groups/${groupId}/members`);
    return members;
  },

  async addMember(groupId: string, email: string, role?: "ADMIN" | "MEMBER"): Promise<void> {
    await apiRequest<void>(`/groups/${groupId}/members`, { method: "POST", body: { email, role } });
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    await apiRequest<void>(`/groups/${groupId}/members/${userId}`, { method: "DELETE" });
  },

  async updateMemberRole(groupId: string, userId: string, role: "OWNER" | "ADMIN" | "MEMBER"): Promise<void> {
    await apiRequest<void>(`/groups/${groupId}/members/${userId}/role`, { method: "PATCH", body: { role } });
  },

  // --- Invitations ----------------------------------------------------------

  async invite(groupId: string, email: string): Promise<void> {
    await apiRequest<void>(`/groups/${groupId}/invitations`, { method: "POST", body: { email } });
  }
};
