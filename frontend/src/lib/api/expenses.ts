import { apiRequest, apiRequestPaginated } from "@/lib/api/client";
import type {
  CreateExpensePayload,
  Expense,
  ExpenseFilters,
  ExpenseWithParticipants,
  UpdateExpensePayload
} from "@/types/expense";
import type { PaginationMeta } from "@/types/api";

export interface ExpenseListResult {
  items: Expense[];
  pagination: PaginationMeta;
}

export const expensesApi = {
  async list(filters: ExpenseFilters = {}): Promise<ExpenseListResult> {
    const result = await apiRequestPaginated<Expense>("/expenses", {
      query: { ...filters }
    });
    return { items: result.data, pagination: result.pagination };
  },

  async get(expenseId: string): Promise<ExpenseWithParticipants> {
    return apiRequest<ExpenseWithParticipants>(`/expenses/${expenseId}`);
  },

  async create(payload: CreateExpensePayload): Promise<ExpenseWithParticipants> {
    return apiRequest<ExpenseWithParticipants>("/expenses", { method: "POST", body: payload });
  },

  async update(expenseId: string, payload: UpdateExpensePayload): Promise<Expense> {
    const { expense } = await apiRequest<{ expense: Expense }>(`/expenses/${expenseId}`, {
      method: "PATCH",
      body: payload
    });
    return expense;
  },

  async remove(expenseId: string): Promise<void> {
    await apiRequest<void>(`/expenses/${expenseId}`, { method: "DELETE" });
  }
};
