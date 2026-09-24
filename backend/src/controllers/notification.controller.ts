import { Request, Response, NextFunction } from "express";
import { notificationService } from "../services/notification.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const { items, pagination, unread } = await notificationService.list(req.user.id, req.query);
      res.status(200).json({ success: true, data: items, pagination, unread });
    } catch (err) {
      next(err);
    }
  },

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const notification = await notificationService.markRead(req.params.id, req.user.id);
      sendSuccess(res, { notification });
    } catch (err) {
      next(err);
    }
  },

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      await notificationService.markAllRead(req.user.id);
      sendSuccess(res, { message: "All notifications marked as read" });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      await notificationService.remove(req.params.id, req.user.id);
      sendSuccess(res, { message: "Notification deleted" });
    } catch (err) {
      next(err);
    }
  }
};
