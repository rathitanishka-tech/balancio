import { Router } from "express";
import { settlementController } from "../controllers/settlement.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createSettlementSchema,
  settlementIdParamSchema,
  listSettlementsQuerySchema
} from "../validators/settlement.validator";

const router = Router();

router.use(requireAuth);

router.post("/", validate(createSettlementSchema), settlementController.create);
router.get("/", validate(listSettlementsQuerySchema), settlementController.list);
router.get("/:settlementId", validate(settlementIdParamSchema), settlementController.getOne);
router.delete("/:settlementId", validate(settlementIdParamSchema), settlementController.remove);

export default router;
