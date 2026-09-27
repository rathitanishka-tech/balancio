import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api/notifications";
import { queryKeys } from "@/lib/utils/query-keys";

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: () => notificationsApi.list(),
    refetchInterval: 60_000 // light polling so the bell feels "live" without WebSockets
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
  });
}
