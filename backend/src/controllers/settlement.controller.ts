import { Request, Response, NextFunction } from "express";
import { settlementService } from "../services/settlement.service";
import { sendPaginated, sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const settlementController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const settlement = await settlementService.createSettlement(req.user.id, req.body);
      sendSuccess(res, { settlement }, 201);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const { items, pagination } = await settlementService.listSettlements(req.user.id, req.query as never);
      sendPaginated(res, items, pagination);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const settlement = await settlementService.getSettlement(req.params.settlementId, req.user.id);
      sendSuccess(res, { settlement });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      await settlementService.deleteSettlement(req.params.settlementId, req.user.id);
      sendSuccess(res, { message: "Settlement deleted" });
    } catch (err) {
      next(err);
    }
  }
};
