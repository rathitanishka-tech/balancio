import { apiRequest } from "@/lib/api/client";
import { getAnalyticsOverview, getAnalyticsTrends } from "@/lib/actions/analytics";

import type {
  AnalyticsOverview,
  CategoryAnalytics,
  GroupAnalytics,
  MonthlyAnalytics,
  TrendPoint
} from "@/types/analytics";

export const analyticsApi = {
  async overview(): Promise<AnalyticsOverview> {
    const data = await getAnalyticsOverview();
    return data;
  },

  async monthly(month: number, year: number, groupId?: string): Promise<MonthlyAnalytics> {
    return {
      month,
      year,
      totalSpending: 0,
      userShare: 0,
      totalPaid: 0,
      totalOwed: 0,
    };
  },

  async categories(groupId?: string): Promise<CategoryAnalytics[]> {
    return [];
  },

  async groups(): Promise<GroupAnalytics[]> {
    return [];
  },

  async trends(groupId?: string, months?: number): Promise<TrendPoint[]> {
    const data = await getAnalyticsTrends(groupId, months);
    return data as unknown as TrendPoint[];
  }
};
