import { Request, Response, NextFunction } from "express";
import { invitationService } from "../services/invitation.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const invitationController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const invitation = await invitationService.createInvitation(
        req.params.groupId,
        req.user.id,
        req.body.email
      );
      sendSuccess(res, { invitation }, 201);
    } catch (err) {
      next(err);
    }
  },

  async listForGroup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitations = await invitationService.listForGroup(
        req.params.groupId,
        req.query.status as string | undefined
      );
      sendSuccess(res, { invitations });
    } catch (err) {
      next(err);
    }
  },

  async respond(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const invitation = await invitationService.respond(req.params.token, req.user.id, req.body.action);
      sendSuccess(res, { invitation });
    } catch (err) {
      next(err);
    }
  }
};
