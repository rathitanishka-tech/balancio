import fs from "fs/promises";
import path from "path";
import { Attachment, IAttachment } from "../models/Attachment";
import { expenseRepository } from "../repositories/expense.repository";
import { assertGroupRole } from "../middleware/role.middleware";
import { NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors";
import { env } from "../config/env";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

export interface UploadedFileMeta {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

function validateFile(file: UploadedFileMeta): void {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new ValidationError(
      `Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP, PDF.`
    );
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new ValidationError(`Unsupported file extension: ${ext}`);
  }
  if (file.size > env.maxFileSize) {
    throw new ValidationError(
      `File exceeds the maximum allowed size of ${(env.maxFileSize / (1024 * 1024)).toFixed(1)}MB.`
    );
  }
}

export const attachmentService = {
  async uploadReceipt(
    userId: string,
    file: UploadedFileMeta,
    expenseId?: string
  ): Promise<IAttachment> {
    validateFile(file);

    if (expenseId) {
      const expense = await expenseRepository.findById(expenseId);
      if (!expense) throw new NotFoundError("Expense");
      await assertGroupRole(expense.groupId.toString(), userId, ["OWNER", "ADMIN", "MEMBER"]);
    }

    return Attachment.create({
      userId,
      expenseId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path
    });
  },

  async getAttachment(attachmentId: string, userId: string): Promise<IAttachment> {
    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment");

    if (attachment.expenseId) {
      const expense = await expenseRepository.findById(attachment.expenseId.toString());
      if (expense) {
        await assertGroupRole(expense.groupId.toString(), userId, ["OWNER", "ADMIN", "MEMBER"]);
        return attachment;
      }
    }

    if (attachment.userId.toString() !== userId) {
      throw new UnauthorizedError("You do not have access to this attachment");
    }

    return attachment;
  },

  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    const attachment = await Attachment.findById(attachmentId);
    if (!attachment) throw new NotFoundError("Attachment");
    if (attachment.userId.toString() !== userId) {
      throw new UnauthorizedError("You can only delete your own attachments");
    }

    await Attachment.findByIdAndDelete(attachmentId);
    try {
      await fs.unlink(attachment.path);
    } catch {
      // File may already be gone - not a fatal error for the API caller.
    }
  }
};
