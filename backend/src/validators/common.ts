import { z } from "zod";
import { Types } from "mongoose";

export const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
  message: "Invalid identifier"
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});
