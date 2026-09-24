import { Router } from "express";
import { debtController } from "../controllers/debt.controller";
import { requireGroupMember } from "../middleware/role.middleware";

// Mounted at /api/groups/:groupId/debts
const router = Router({ mergeParams: true });

router.get("/", requireGroupMember(), debtController.getDirectDebts);
router.get("/simplified", requireGroupMember(), debtController.getSimplifiedDebts);

export default router;
