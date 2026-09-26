import { apiRequestPaginated, apiRequest } from "@/lib/api/client";
import type { Notification } from "@/types/notification";
import type { PaginationMeta } from "@/types/api";

export interface NotificationListResult {
  items: Notification[];
  pagination: PaginationMeta;
  unread: number;
}


export const notificationsApi = {
  async list(page = 1, limit = 20): Promise<NotificationListResult> {
    const result = await apiRequestPaginated<Notification>("/notifications", { query: { page, limit } });
    return { items: result.data, pagination: result.pagination, unread: result.unread ?? 0 };
  },

  async markRead(id: string): Promise<void> {
    await apiRequest<void>(`/notifications/${id}/read`, { method: "PATCH" });
  },

  async markAllRead(): Promise<void> {
    await apiRequest<void>("/notifications/read-all", { method: "PATCH" });
  },

  async remove(id: string): Promise<void> {
    await apiRequest<void>(`/notifications/${id}`, { method: "DELETE" });
  }
};
