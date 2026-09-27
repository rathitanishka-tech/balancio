import { notificationRepository } from "../repositories/notification.repository";
import { NotificationType } from "../models/Notification";
import { PaginationMeta, buildPaginationMeta, parsePagination } from "../utils/pagination";
import { NotFoundError } from "../utils/errors";
import { INotification } from "../models/Notification";

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedGroupId?: string;
  relatedExpenseId?: string;
  relatedSettlementId?: string;
}

export const notificationService = {
  async notify(input: NotifyInput): Promise<void> {
    await notificationRepository.create(input);
  },

  async notifyMany(inputs: NotifyInput[]): Promise<void> {
    await notificationRepository.createMany(inputs);
  },

  async list(
    userId: string,
    query: Record<string, unknown>
  ): Promise<{ items: INotification[]; pagination: PaginationMeta; unread: number }> {
    const { page, limit, skip } = parsePagination(query);
    const { items, total, unread } = await notificationRepository.listForUser(userId, skip, limit);
    return { items, pagination: buildPaginationMeta(page, limit, total), unread };
  },

  async markRead(id: string, userId: string): Promise<INotification> {
    const updated = await notificationRepository.markRead(id, userId);
    if (!updated) throw new NotFoundError("Notification");
    return updated;
  },

  async markAllRead(userId: string): Promise<void> {
    await notificationRepository.markAllRead(userId);
  },

  async remove(id: string, userId: string): Promise<void> {
    await notificationRepository.deleteById(id, userId);
  }
};
