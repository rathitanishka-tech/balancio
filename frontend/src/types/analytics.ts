export interface AnalyticsOverview {
  groupCount: number;
  expenseCount: number;
  totalSpending: number;
  userShare: number;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface MonthlyAnalytics {
  month: number;
  year: number;
  totalSpending: number;
  userShare: number;
  totalPaid: number;
  totalOwed: number;
}

export interface CategoryAnalytics {
  category: string;
  totalSpending: number;
  userShare: number;
  count: number;
}

export interface GroupAnalytics {
  groupId: string;
  name: string;
  totalSpending: number;
  userShare: number;
  totalPaid: number;
  expenseCount: number;
}

export interface TrendPoint {
  month: string; // "YYYY-MM"
  totalSpending: number;
  userShare: number;
}
