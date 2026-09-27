import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expensesApi } from "@/lib/api/expenses";
import { queryKeys } from "@/lib/utils/query-keys";
import type { CreateExpensePayload, ExpenseFilters, UpdateExpensePayload } from "@/types/expense";

export function useExpenses(filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: queryKeys.expenses(filters as Record<string, unknown>),
    queryFn: () => expensesApi.list(filters)
  });
}

export function useExpense(expenseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expense(expenseId ?? ""),
    queryFn: () => expensesApi.get(expenseId as string),
    enabled: Boolean(expenseId)
  });
}

/**
 * Every mutation below invalidates the full set of views a financial
 * change can affect - dashboard analytics, the expense list, this group's
 * balances/debts, and notifications - per the spec's "after mutations,
 * invalidate relevant queries" requirement (section 60/75).
 */
function invalidateFinancialViews(queryClient: ReturnType<typeof useQueryClient>, groupId?: string) {
  queryClient.invalidateQueries({ queryKey: ["expenses"] });
  queryClient.invalidateQueries({ queryKey: ["analytics"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
  if (groupId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.balances(groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.directDebts(groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.simplifiedDebts(groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.group(groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.groupActivity(groupId) });
  }
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => expensesApi.create(payload),
    onSuccess: (result) => invalidateFinancialViews(queryClient, result.expense.groupId)
  });
}

export function useUpdateExpense(expenseId: string, groupId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateExpensePayload) => expensesApi.update(expenseId, payload),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expense(expenseId) });
      invalidateFinancialViews(queryClient, groupId ?? expense.groupId);
    }
  });
}

export function useDeleteExpense(groupId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.remove(expenseId),
    onSuccess: () => invalidateFinancialViews(queryClient, groupId)
  });
}
