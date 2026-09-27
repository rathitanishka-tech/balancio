export type SplitType = "EQUAL" | "PERCENTAGE" | "CUSTOM";

/** Raw participant input as sent by the client for PERCENTAGE/CUSTOM splits. */
export interface ParticipantInput {
  userId: string;
  /** Required when splitType === "PERCENTAGE" */
  percentage?: number;
  /** Required when splitType === "CUSTOM", expressed in the expense's minor currency unit */
  shareAmount?: number;
}

export interface CreateExpenseInput {
  groupId: string;
  title: string;
  description?: string;
  /** Amount in minor currency units (e.g. paise), always an integer */
  amount: number;
  currency?: string;
  category?: string;
  paidBy: string;
  splitType: SplitType;
  date?: string;
  participants: ParticipantInput[];
  receipt?: string;
}

export interface UpdateExpenseInput {
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  category?: string;
  paidBy?: string;
  splitType?: SplitType;
  date?: string;
  participants?: ParticipantInput[];
  receipt?: string;
}

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

/** Result of running the split calculation - always sums exactly to `amount`. */
export interface CalculatedShare {
  userId: string;
  shareAmount: number; // minor units
  percentage?: number;
}
