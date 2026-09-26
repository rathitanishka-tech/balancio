import { z } from "zod";

export const settlementFormSchema = z.object({
  toUser: z.string().min(1, "Pick who you're paying"),
  amount: z.coerce.number({ invalid_type_error: "Enter an amount" }).positive("Amount must be greater than zero"),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "OTHER"]),
  note: z.string().max(500).optional()
});
export type SettlementFormValues = z.infer<typeof settlementFormSchema>;
