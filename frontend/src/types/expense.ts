export type SplitType = "EQUAL" | "PERCENTAGE" | "CUSTOM";

/** All amounts are integers in minor currency units (e.g. paise), exactly as the backend stores/returns them. */
export interface Expense {
  _id: string;
  groupId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  category: string;
  paidBy: string;
  splitType: SplitType;
  date: string;
  createdBy: string;
  receipt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseParticipant {
  userId: string;
  shareAmount: number;
  percentage?: number;
}

export interface ExpenseWithParticipants {
  expense: Expense;
  participants: ExpenseParticipant[];
}

export interface ParticipantInput {
  userId: string;
  percentage?: number;
  shareAmount?: number;
}

export interface CreateExpensePayload {
  groupId: string;
  title: string;
  description?: string;
  amount: number;
  category?: string;
  paidBy: string;
  splitType: SplitType;
  date?: string;
  participants: ParticipantInput[];
}

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export interface ExpenseFilters {
  group?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  paidBy?: string;
  participant?: string;
  page?: number;
  limit?: number;
}

export const EXPENSE_CATEGORIES = [
  "General",
  "Food",
  "Travel",
  "Accommodation",
  "Utilities",
  "Rent",
  "Entertainment",
  "Groceries",
  "Transport",
  "Shopping",
  "Healthcare",
  "Other"
] as const;
