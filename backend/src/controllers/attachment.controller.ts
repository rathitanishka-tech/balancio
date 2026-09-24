import { Request, Response, NextFunction } from "express";
import { attachmentService } from "../services/attachment.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError, ValidationError } from "../utils/errors";

export const attachmentController = {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      if (!req.file) throw new ValidationError("A file is required");

      const attachment = await attachmentService.uploadReceipt(
        req.user.id,
        {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path
        },
        req.body.expenseId
      );
      sendSuccess(res, { attachment }, 201);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const attachment = await attachmentService.getAttachment(req.params.attachmentId, req.user.id);
      sendSuccess(res, { attachment });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      await attachmentService.deleteAttachment(req.params.attachmentId, req.user.id);
      sendSuccess(res, { message: "Attachment deleted" });
    } catch (err) {
      next(err);
    }
  }
};
