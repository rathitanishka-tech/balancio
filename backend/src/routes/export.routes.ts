import { Router } from "express";
import { exportController } from "../controllers/export.controller";
import { requireGroupMember } from "../middleware/role.middleware";

// Mounted at /api/groups/:groupId/export
const router = Router({ mergeParams: true });

router.get("/csv", requireGroupMember(), exportController.csv);
router.get("/pdf", requireGroupMember(), exportController.pdf);

export default router;
