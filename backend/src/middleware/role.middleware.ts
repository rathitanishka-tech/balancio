import { NextFunction, Request, Response } from "express";
import { groupRepository } from "../repositories/group.repository";
import { UnauthenticatedError, UnauthorizedError, NotFoundError } from "../utils/errors";
import { GroupRole } from "../models/GroupMember";

/**
 * PERMISSIONS SUMMARY
 * ---------------------------------------------------------------------
 * OWNER  - everything (manage group, members, expenses, settlements, delete group)
 * ADMIN  - manage members, create/edit/delete expenses, view analytics, settlements
 * MEMBER - view group, create expenses, view balances, create their own settlements
 *
 * All of these checks happen server-side and read the group id from the
 * route params (`:groupId`) and the authenticated user from `req.user`
 * (never from client-supplied body fields).
 */

function getGroupId(req: Request): string {
  const groupId = req.params.groupId;
  if (!groupId) {
    throw new Error("requireGroupMember/requireAdmin/requireOwner used on a route without :groupId");
  }
  return groupId;
}

export function requireGroupMember() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthenticatedError();
      const groupId = getGroupId(req);

      const group = await groupRepository.findById(groupId);
      if (!group) throw new NotFoundError("Group");

      const membership = await groupRepository.findMembership(groupId, req.user.id);
      if (!membership) {
        throw new UnauthorizedError("You are not a member of this group");
      }

      req.membership = { groupId, role: membership.role };
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function requireAdmin() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    requireGroupMember()(req, res, (err?: unknown) => {
      if (err) {
        next(err);
        return;
      }
      const role = req.membership?.role;
      if (role !== "OWNER" && role !== "ADMIN") {
        next(new UnauthorizedError("Only group admins or the owner can perform this action"));
        return;
      }
      next();
    });
  };
}

export function requireOwner() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    requireGroupMember()(req, res, (err?: unknown) => {
      if (err) {
        next(err);
        return;
      }
      if (req.membership?.role !== "OWNER") {
        next(new UnauthorizedError("Only the group owner can perform this action"));
        return;
      }
      next();
    });
  };
}

/**
 * Non-middleware helper for services that need to authorize an action
 * against a groupId that isn't present in the URL (e.g. expense/settlement
 * creation, where the group is specified in the request body).
 */
export async function assertGroupRole(
  groupId: string,
  userId: string,
  allowed: GroupRole[]
): Promise<GroupRole> {
  const membership = await groupRepository.findMembership(groupId, userId);
  if (!membership) {
    throw new UnauthorizedError("You are not a member of this group");
  }
  if (!allowed.includes(membership.role)) {
    throw new UnauthorizedError("You do not have permission to perform this action");
  }
  return membership.role;
}
