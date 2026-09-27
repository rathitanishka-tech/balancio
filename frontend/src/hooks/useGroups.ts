import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "@/lib/api/groups";
import { queryKeys } from "@/lib/utils/query-keys";
import type { CreateGroupPayload, UpdateGroupPayload } from "@/types/group";

export function useGroups() {
  return useQuery({ queryKey: queryKeys.groups(), queryFn: groupsApi.list });
}

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.group(groupId ?? ""),
    queryFn: () => groupsApi.get(groupId as string),
    enabled: Boolean(groupId)
  });
}

export function useGroupMembers(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupMembers(groupId ?? ""),
    queryFn: () => groupsApi.listMembers(groupId as string),
    enabled: Boolean(groupId)
  });
}

export function useGroupActivity(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupActivity(groupId ?? ""),
    queryFn: () => groupsApi.activity(groupId as string),
    enabled: Boolean(groupId)
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGroupPayload) => groupsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
      queryClient.invalidateQueries({ queryKey: queryKeys.analyticsGroups() });
    }
  });
}

export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateGroupPayload) => groupsApi.update(groupId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    }
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.remove(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups() });
    }
  });
}

export function useAddMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role?: "ADMIN" | "MEMBER" }) =>
      groupsApi.addMember(groupId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances(groupId) });
    }
  });
}

export function useInviteMember(groupId: string) {
  return useMutation({
    mutationFn: (email: string) => groupsApi.invite(groupId, email)
  });
}

export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.balances(groupId) });
    }
  });
}

export function useUpdateMemberRole(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "OWNER" | "ADMIN" | "MEMBER" }) =>
      groupsApi.updateMemberRole(groupId, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
    }
  });
}
