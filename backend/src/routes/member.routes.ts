import { Router } from "express";
import { memberController } from "../controllers/member.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireAdmin, requireGroupMember, requireOwner } from "../middleware/role.middleware";
import { validate } from "../middleware/validation.middleware";
import { addMemberSchema, removeMemberSchema, updateMemberRoleSchema } from "../validators/group.validator";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.get("/", requireGroupMember(), memberController.list);
router.post("/", requireAdmin(), validate(addMemberSchema), memberController.add);
router.delete("/:userId", requireAdmin(), validate(removeMemberSchema), memberController.remove);
router.patch(
  "/:userId/role",
  requireOwner(),
  validate(updateMemberRoleSchema),
  memberController.updateRole
);

export default router;
