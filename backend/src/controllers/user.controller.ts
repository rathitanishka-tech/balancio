import { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const userController = {
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const user = await userService.getById(req.user.id);
      sendSuccess(res, { user });
    } catch (err) {
      next(err);
    }
  },

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const user = await userService.updateProfile(req.user.id, req.body);
      sendSuccess(res, { user });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      await userService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
      sendSuccess(res, { message: "Password updated" });
    } catch (err) {
      next(err);
    }
  },

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = String(req.query.q ?? "");
      const users = await userService.searchUsers(query);
      sendSuccess(res, { users });
    } catch (err) {
      next(err);
    }
  }
};
