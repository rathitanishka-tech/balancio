import { z } from "zod";
import { objectIdSchema } from "./common";

export const createSettlementSchema = z.object({
  body: z
    .object({
      groupId: objectIdSchema,
      fromUser: objectIdSchema,
      toUser: objectIdSchema,
      amount: z.number().int().positive("Amount must be a positive integer (minor currency units)"),
      currency: z.string().length(3).optional(),
      paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "OTHER"]).optional(),
      note: z.string().trim().max(500).optional(),
      date: z.string().optional()
    })
    .refine((data) => data.fromUser !== data.toUser, {
      message: "fromUser and toUser must be different",
      path: ["toUser"]
    })
});

export const settlementIdParamSchema = z.object({
  params: z.object({ settlementId: objectIdSchema })
});

export const listSettlementsQuerySchema = z.object({
  query: z.object({
    group: objectIdSchema.optional(),
    userId: objectIdSchema.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
});
