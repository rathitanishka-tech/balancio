import { Request, Response, NextFunction } from "express";
import { debtService } from "../services/debt.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const debtController = {
  async getDirectDebts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const debts = await debtService.getDirectDebts(req.params.groupId, req.user.id);
      sendSuccess(res, debts);
    } catch (err) {
      next(err);
    }
  },

  async getSimplifiedDebts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const result = await debtService.getSimplifiedDebts(req.params.groupId, req.user.id);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
};
