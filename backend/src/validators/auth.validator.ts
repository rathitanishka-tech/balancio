import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required").max(120),
    email: z.string().trim().email("A valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    currency: z.string().length(3).optional(),
    timezone: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email("A valid email is required"),
    password: z.string().min(1, "Password is required")
  })
});

export type RegisterSchema = z.infer<typeof registerSchema>["body"];
export type LoginSchema = z.infer<typeof loginSchema>["body"];
