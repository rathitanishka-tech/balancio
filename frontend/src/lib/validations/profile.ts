import { z } from "zod";
import { CURRENCIES } from "@/lib/utils/constants";

export const profileFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  avatar: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
  currency: z.enum(CURRENCIES),
  timezone: z.string().min(1, "Pick a timezone")
});
export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password")
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
