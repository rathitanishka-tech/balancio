import { z } from "zod";

const participantSchema = z.object({
  userId: z.string().min(1),
  name: z.string().optional(),
  included: z.boolean().default(true),
  percentage: z.number().min(0).max(100).optional(),
  shareAmount: z.number().min(0).optional() // major units (rupees) in the form; converted to minor units on submit
});

export const expenseFormSchema = z
  .object({
    title: z.string().trim().min(1, "Give this expense a title").max(200),
    amount: z.coerce.number({ invalid_type_error: "Enter an amount" }).positive("Amount must be greater than zero"),
    date: z.string().min(1, "Pick a date"),
    category: z.string().min(1, "Pick a category"),
    groupId: z.string().min(1, "Pick a group"),
    paidBy: z.string().min(1, "Pick who paid"),
    splitType: z.enum(["EQUAL", "PERCENTAGE", "CUSTOM"]),
    notes: z.string().max(1000).optional(),
    participants: z.array(participantSchema).min(1, "Add at least one participant")
  })
  .superRefine((data, ctx) => {
    const included = data.participants.filter((p) => p.included);
    if (included.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one participant",
        path: ["participants"]
      });
      return;
    }

    if (data.splitType === "PERCENTAGE") {
      const total = included.reduce((sum, p) => sum + (p.percentage ?? 0), 0);
      if (Math.abs(total - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Percentages must add up to 100 (currently ${total.toFixed(1)})`,
          path: ["participants"]
        });
      }
    }

    if (data.splitType === "CUSTOM") {
      const total = included.reduce((sum, p) => sum + (p.shareAmount ?? 0), 0);
      if (Math.abs(total - data.amount) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Custom shares must add up to the total amount (${data.amount})`,
          path: ["participants"]
        });
      }
    }
  });

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
