import { Request, Response, NextFunction } from "express";
import { exportService } from "../services/export.service";
import { UnauthenticatedError } from "../utils/errors";

export const exportController = {
  async csv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const { filename, content } = await exportService.exportGroupCsv(req.params.groupId, req.user.id);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send(content);
    } catch (err) {
      next(err);
    }
  },

  async pdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const { filename, stream } = await exportService.exportGroupPdf(req.params.groupId, req.user.id);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }
};
