export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";

export interface Settlement {
  _id: string;
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  note?: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateSettlementPayload {
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  note?: string;
  date?: string;
}

export interface SettlementFilters {
  group?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "UPI", label: "UPI" },
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "OTHER", label: "Other" }
];
