import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth);

router.get("/overview", analyticsController.overview);
router.get("/monthly", analyticsController.monthly);
router.get("/categories", analyticsController.categories);
router.get("/groups", analyticsController.groups);
router.get("/trends", analyticsController.trends);

export default router;
