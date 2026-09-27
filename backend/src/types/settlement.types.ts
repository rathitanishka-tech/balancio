export type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER" | "OTHER";

export interface CreateSettlementInput {
  groupId: string;
  fromUser: string;
  toUser: string;
  amount: number; // minor units
  currency?: string;
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
