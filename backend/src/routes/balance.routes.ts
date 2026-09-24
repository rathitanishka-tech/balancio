import { Router } from "express";
import { balanceController } from "../controllers/balance.controller";
import { requireGroupMember } from "../middleware/role.middleware";

// Mounted at /api/groups/:groupId/balances
const router = Router({ mergeParams: true });

router.get("/", requireGroupMember(), balanceController.getGroupBalances);

export default router;
