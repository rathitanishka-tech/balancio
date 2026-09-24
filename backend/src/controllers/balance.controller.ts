import { Request, Response, NextFunction } from "express";
import { calculateGroupBalances } from "../services/balance.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const balanceController = {
  async getGroupBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const balances = await calculateGroupBalances(req.params.groupId, req.user.id);
      sendSuccess(res, { groupId: req.params.groupId, balances });
    } catch (err) {
      next(err);
    }
  }
};
