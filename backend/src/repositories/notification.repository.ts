import { Types } from "mongoose";
import { Notification, INotification, NotificationType } from "../models/Notification";

export const notificationRepository = {
  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    relatedGroupId?: string;
    relatedExpenseId?: string;
    relatedSettlementId?: string;
  }): Promise<INotification> {
    return Notification.create(data);
  },

  async createMany(
    entries: {
      userId: string;
      type: NotificationType;
      title: string;
      message: string;
      relatedGroupId?: string;
      relatedExpenseId?: string;
      relatedSettlementId?: string;
    }[]
  ): Promise<void> {
    if (entries.length === 0) return;
    await Notification.insertMany(entries);
  },

  async listForUser(
    userId: string,
    skip: number,
    limit: number
  ): Promise<{ items: INotification[]; total: number; unread: number }> {
    const [items, total, unread] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, read: false })
    ]);
    return { items, total, unread };
  },

  async markRead(id: string, userId: string): Promise<INotification | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
  },

  async markAllRead(userId: string): Promise<void> {
    await Notification.updateMany({ userId, read: false }, { read: true });
  },

  async deleteById(id: string, userId: string): Promise<void> {
    await Notification.findOneAndDelete({ _id: id, userId });
  }
};
