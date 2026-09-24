import { Request, Response, NextFunction } from "express";
import { analyticsService } from "../services/analytics.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError, ValidationError } from "../utils/errors";

export const analyticsController = {
  async overview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const data = await analyticsService.getOverview(req.user.id);
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async monthly(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const month = Number(req.query.month);
      const year = Number(req.query.year);
      if (!Number.isInteger(month) || !Number.isInteger(year)) {
        throw new ValidationError("month and year query parameters are required integers");
      }
      const data = await analyticsService.getMonthly(
        req.user.id,
        month,
        year,
        req.query.groupId as string | undefined
      );
      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async categories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const data = await analyticsService.getCategories(req.user.id, req.query.groupId as string | undefined);
      sendSuccess(res, { categories: data });
    } catch (err) {
      next(err);
    }
  },

  async groups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const data = await analyticsService.getGroupsBreakdown(req.user.id);
      sendSuccess(res, { groups: data });
    } catch (err) {
      next(err);
    }
  },

  async trends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const months = req.query.months ? Number(req.query.months) : undefined;
      const data = await analyticsService.getTrends(
        req.user.id,
        req.query.groupId as string | undefined,
        months
      );
      sendSuccess(res, { trends: data });
    } catch (err) {
      next(err);
    }
  }
};
