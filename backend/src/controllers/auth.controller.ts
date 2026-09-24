import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, auth } = await authService.register(req.body);
      sendSuccess(res, { user, token: auth.token, expiresIn: auth.expiresIn }, 201);
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, auth } = await authService.login(req.body);
      sendSuccess(res, { user, token: auth.token, expiresIn: auth.expiresIn });
    } catch (err) {
      next(err);
    }
  },

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout();
      sendSuccess(res, { message: "Logged out" });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const user = await userService.getById(req.user.id);
      sendSuccess(res, { user });
    } catch (err) {
      next(err);
    }
  }
};
