import { Request, Response, NextFunction } from "express";
import { groupService } from "../services/group.service";
import { activityService } from "../services/activity.service";
import { sendSuccess } from "../utils/response";
import { UnauthenticatedError } from "../utils/errors";

export const groupController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const group = await groupService.createGroup(req.user.id, req.body);
      sendSuccess(res, { group }, 201);
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const groups = await groupService.listGroupsForUser(req.user.id);
      sendSuccess(res, { groups });
    } catch (err) {
      next(err);
    }
  },

  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const group = await groupService.getGroup(req.params.groupId, req.user.id);
      sendSuccess(res, { group });
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const group = await groupService.updateGroup(req.params.groupId, req.user.id, req.body);
      sendSuccess(res, { group });
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      await groupService.deleteGroup(req.params.groupId, req.user.id);
      sendSuccess(res, { message: "Group deleted" });
    } catch (err) {
      next(err);
    }
  },

  async activity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthenticatedError();
      // Membership is enforced by the requireGroupMember route middleware.
      const activity = await activityService.listForGroup(req.params.groupId);
      sendSuccess(res, { activity });
    } catch (err) {
      next(err);
    }
  }
};
