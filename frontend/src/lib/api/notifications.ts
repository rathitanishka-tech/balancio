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
    return { items: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 }, unread: 0 };
  },

  async markRead(id: string): Promise<void> {
    return Promise.resolve();
  },

  async markAllRead(): Promise<void> {
    return Promise.resolve();
  },

  async remove(id: string): Promise<void> {
    return Promise.resolve();
  }
};
