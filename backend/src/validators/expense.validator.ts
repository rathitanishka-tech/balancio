import { z } from "zod";
import { objectIdSchema } from "./common";

const participantSchema = z.object({
  userId: objectIdSchema,
  percentage: z.number().min(0).max(100).optional(),
  shareAmount: z.number().int().min(0).optional()
});

const baseExpenseBody = z.object({
  groupId: objectIdSchema,
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(1000).optional(),
  amount: z.number().int().positive("Amount must be a positive integer (minor currency units)"),
  currency: z.string().length(3).optional(),
  category: z.string().trim().max(60).optional(),
  paidBy: objectIdSchema,
  splitType: z.enum(["EQUAL", "PERCENTAGE", "CUSTOM"]),
  date: z.string().datetime().optional().or(z.string().optional()),
  participants: z.array(participantSchema).min(1, "At least one participant is required"),
  receipt: z.string().optional()
});

function refineParticipants(data: z.infer<typeof baseExpenseBody>, ctx: z.RefinementCtx): void {
  if (data.splitType === "PERCENTAGE") {
    const missing = data.participants.some((p) => p.percentage === undefined);
    if (missing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Every participant must include a percentage for PERCENTAGE splits",
        path: ["participants"]
      });
    }
  }
  if (data.splitType === "CUSTOM") {
    const missing = data.participants.some((p) => p.shareAmount === undefined);
    if (missing) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Every participant must include a shareAmount for CUSTOM splits",
        path: ["participants"]
      });
    }
  }
  const ids = data.participants.map((p) => p.userId);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Duplicate participants are not allowed",
      path: ["participants"]
    });
  }
}

export const createExpenseSchema = z.object({
  body: baseExpenseBody.superRefine(refineParticipants)
});

export const updateExpenseSchema = z.object({
  params: z.object({ expenseId: objectIdSchema }),
  body: baseExpenseBody
    .partial()
    .extend({ groupId: objectIdSchema.optional() })
    .superRefine((data, ctx) => {
      if (data.participants && data.splitType) {
        refineParticipants(data as z.infer<typeof baseExpenseBody>, ctx);
      }
    })
});

export const expenseIdParamSchema = z.object({
  params: z.object({ expenseId: objectIdSchema })
});

export const listExpensesQuerySchema = z.object({
  query: z.object({
    group: objectIdSchema.optional(),
    category: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    paidBy: objectIdSchema.optional(),
    participant: objectIdSchema.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional()
  })
});
