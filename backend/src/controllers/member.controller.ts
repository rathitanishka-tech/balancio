import { Request, Response, NextFunction } from "express";
import { memberService } from "../services/member.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const memberController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await memberService.listMembers(req.params.groupId);
      sendSuccess(res, {
        members: members.map((m) => ({
          userId: m.member.userId.toString(),
          name: m.name,
          email: m.email,
          role: m.member.role,
          joinedAt: m.member.joinedAt
        }))
      });
    } catch (err) {
      next(err);
    }
  },

  async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const member = await memberService.addMemberByEmail(
        req.params.groupId,
        req.user.id,
        req.body.email,
        req.body.role
      );
      sendSuccess(res, { member }, 201);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      await memberService.removeMember(req.params.groupId, req.user.id, req.params.userId);
      sendSuccess(res, { message: "Member removed" });
    } catch (err) {
      next(err);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const member = await memberService.updateMemberRole(
        req.params.groupId,
        req.user.id,
        req.params.userId,
        req.body.role
      );
      sendSuccess(res, { member });
    } catch (err) {
      next(err);
    }
  }
};
