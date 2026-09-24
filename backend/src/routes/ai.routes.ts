import { Router } from "express";
import multer from "multer";
import { parseExpense, parseReceipt, generateInsights, explainDebt, askExpenses } from "../controllers/ai.controller";
import { requireAuth, optionalAuth } from "../middleware/auth.middleware";

import { aiRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();
// Use memory storage for processing receipt images in-memory before sending to AI
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

router.use(aiRateLimiter);

router.post("/parse-expense", requireAuth, parseExpense);
router.post("/parse-receipt", requireAuth, upload.single("receipt"), parseReceipt);
router.post("/insights", requireAuth, generateInsights);
router.post("/explain-debt", requireAuth, explainDebt);
router.post("/ask", optionalAuth, askExpenses);

export default router;
