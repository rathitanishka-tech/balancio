import { Router } from "express";
import { invitationController } from "../controllers/invitation.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin, requireGroupMember } from "../middleware/role.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createInvitationSchema,
  respondInvitationSchema
} from "../validators/invitation.validator";

/**
 * Mounted at /api/groups/:groupId/invitations - creating and listing
 * invitations happens in the context of a specific group.
 */
export const groupInvitationRouter = Router({ mergeParams: true });

groupInvitationRouter.use(requireAuth);
groupInvitationRouter.post(
  "/",
  requireAdmin(),
  validate(createInvitationSchema),
  invitationController.create
);
groupInvitationRouter.get("/", requireGroupMember(), invitationController.listForGroup);

/**
 * Mounted at /api/invitations - responding to an invitation happens via
 * its unique token and isn't scoped to a group URL segment.
 */
export const invitationTokenRouter = Router();

invitationTokenRouter.post(
  "/:token/respond",
  requireAuth,
  validate(respondInvitationSchema),
  invitationController.respond
);

export default groupInvitationRouter;
