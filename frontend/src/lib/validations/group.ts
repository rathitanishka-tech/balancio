import { z } from "zod";
import { CURRENCIES } from "@/lib/utils/constants";

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Group name is required").max(120, "Name is too long"),
  description: z.string().trim().max(500, "Keep the description under 500 characters").optional(),
  currency: z.enum(CURRENCIES).default("INR")
});
export type CreateGroupFormValues = z.infer<typeof createGroupSchema>;
