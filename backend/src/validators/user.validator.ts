import { z } from "zod";

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    avatar: z.string().url().optional().or(z.literal("")),
    currency: z.string().length(3).optional(),
    timezone: z.string().optional(),
    notificationPreferences: z
      .object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        expenseCreated: z.boolean().optional(),
        settlementCreated: z.boolean().optional()
      })
      .partial()
      .optional()
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8)
  })
});
