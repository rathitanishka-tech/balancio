import { Request, Response, NextFunction } from "express";
import { searchService } from "../services/search.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const searchController = {
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const query = String(req.query.q ?? "");
      const results = await searchService.search(req.user.id, query);
      sendSuccess(res, results);
    } catch (err) {
      next(err);
    }
  }
};
