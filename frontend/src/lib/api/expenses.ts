import { createExpense, getExpenses, updateExpense, deleteExpense, getExpenseById } from "@/lib/actions/expenses";
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
    const data = await getExpenses({
      groupId: filters.group,
      limit: filters.limit,
      page: filters.page,
    });
    return data as ExpenseListResult;
  },

  async get(expenseId: string): Promise<ExpenseWithParticipants> {
    const exp = await getExpenseById(expenseId);
    return exp as unknown as ExpenseWithParticipants;
  },

  async create(payload: CreateExpensePayload): Promise<ExpenseWithParticipants> {
    const expense = await createExpense(payload);
    return expense as unknown as ExpenseWithParticipants;
  },

  async update(expenseId: string, payload: UpdateExpensePayload): Promise<Expense> {
    const expense = await updateExpense(expenseId, payload);
    return expense as unknown as Expense;
  },

  async remove(expenseId: string): Promise<void> {
    await deleteExpense(expenseId);
  }
};
