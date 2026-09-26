import { apiRequest } from "@/lib/api/client";

import type {
  AnalyticsOverview,
  CategoryAnalytics,
  GroupAnalytics,
  MonthlyAnalytics,
  TrendPoint
} from "@/types/analytics";

export const analyticsApi = {
  async overview(): Promise<AnalyticsOverview> {
    return apiRequest<AnalyticsOverview>("/analytics/overview");
  },

  async monthly(month: number, year: number, groupId?: string): Promise<MonthlyAnalytics> {
    return apiRequest<MonthlyAnalytics>("/analytics/monthly", { query: { month, year, groupId } });
  },

  async categories(groupId?: string): Promise<CategoryAnalytics[]> {
    const { categories } = await apiRequest<{ categories: CategoryAnalytics[] }>("/analytics/categories", {
      query: { groupId }
    });
    return categories;
  },

  async groups(): Promise<GroupAnalytics[]> {
    const { groups } = await apiRequest<{ groups: GroupAnalytics[] }>("/analytics/groups");
    return groups;
  },

  async trends(groupId?: string, months?: number): Promise<TrendPoint[]> {
    const { trends } = await apiRequest<{ trends: TrendPoint[] }>("/analytics/trends", {
      query: { groupId, months }
    });
    return trends;
  }
};
