/**
 * Centralized query key factory. Using functions (not ad-hoc arrays
 * scattered through components) means invalidation after a mutation is
 * always spelled the same way - see hooks/useExpenses.ts for the
 * canonical example of invalidating dashboard/balances/debts/analytics
 * together after creating an expense.
 */
export const queryKeys = {
  me: () => ["me"] as const,

  groups: () => ["groups"] as const,
  group: (groupId: string) => ["groups", groupId] as const,
  groupMembers: (groupId: string) => ["groups", groupId, "members"] as const,
  groupActivity: (groupId: string) => ["groups", groupId, "activity"] as const,

  expenses: (filters?: Record<string, unknown>) => ["expenses", filters ?? {}] as const,
  expense: (expenseId: string) => ["expenses", "detail", expenseId] as const,

  balances: (groupId: string) => ["balances", groupId] as const,

  directDebts: (groupId: string) => ["debts", "direct", groupId] as const,
  simplifiedDebts: (groupId: string) => ["debts", "simplified", groupId] as const,

  settlements: (filters?: Record<string, unknown>) => ["settlements", filters ?? {}] as const,
  settlement: (settlementId: string) => ["settlements", "detail", settlementId] as const,

  notifications: () => ["notifications"] as const,

  analyticsOverview: () => ["analytics", "overview"] as const,
  analyticsMonthly: (month: number, year: number, groupId?: string) =>
    ["analytics", "monthly", month, year, groupId ?? null] as const,
  analyticsCategories: (groupId?: string) => ["analytics", "categories", groupId ?? null] as const,
  analyticsGroups: () => ["analytics", "groups"] as const,
  analyticsTrends: (groupId?: string) => ["analytics", "trends", groupId ?? null] as const,

  search: (query: string) => ["search", query] as const
};
