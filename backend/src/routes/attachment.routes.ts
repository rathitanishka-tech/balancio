import { Router } from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import { attachmentController } from "../controllers/attachment.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { env } from "../config/env";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");
    cb(null, `${Date.now()}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Multer performs a first-pass size limit; attachment.service.ts performs
// the authoritative MIME type / extension / size validation afterwards.
const upload = multer({
  storage,
  limits: { fileSize: env.maxFileSize }
});

const router = Router();

router.use(requireAuth);

router.post("/", upload.single("file"), attachmentController.upload);
router.get("/:attachmentId", attachmentController.getOne);
router.delete("/:attachmentId", attachmentController.remove);

export default router;
