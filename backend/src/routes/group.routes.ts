import { Router } from "express";
import { groupController } from "../controllers/group.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin, requireGroupMember, requireOwner } from "../middleware/role.middleware";
import { validate } from "../middleware/validation.middleware";
import { createGroupSchema, updateGroupSchema, groupIdParamSchema } from "../validators/group.validator";
import memberRoutes from "./member.routes";
import { groupInvitationRouter } from "./invitation.routes";
import balanceRoutes from "./balance.routes";
import debtRoutes from "./debt.routes";
import exportRoutes from "./export.routes";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createGroupSchema), groupController.create);
router.get("/", groupController.list);
router.get("/:groupId", validate(groupIdParamSchema), requireGroupMember(), groupController.getOne);
router.patch("/:groupId", validate(updateGroupSchema), requireAdmin(), groupController.update);
router.delete("/:groupId", validate(groupIdParamSchema), requireOwner(), groupController.remove);

router.get(
  "/:groupId/activity",
  validate(groupIdParamSchema),
  requireGroupMember(),
  groupController.activity
);

// --- Nested resources ---------------------------------------------------
// Each nested router uses `mergeParams: true` so it can read `:groupId`
// from the parent route and enforce its own auth/role checks per-request.
router.use("/:groupId/members", memberRoutes);
router.use("/:groupId/invitations", groupInvitationRouter);
router.use("/:groupId/balances", balanceRoutes);
router.use("/:groupId/debts", debtRoutes);
router.use("/:groupId/export", exportRoutes);

export default router;
