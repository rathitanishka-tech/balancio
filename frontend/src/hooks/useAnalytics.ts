import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api/analytics";
import { queryKeys } from "@/lib/utils/query-keys";

export function useAnalyticsOverview() {
  return useQuery({ queryKey: queryKeys.analyticsOverview(), queryFn: analyticsApi.overview });
}

export function useAnalyticsMonthly(month: number, year: number, groupId?: string) {
  return useQuery({
    queryKey: queryKeys.analyticsMonthly(month, year, groupId),
    queryFn: () => analyticsApi.monthly(month, year, groupId)
  });
}

export function useAnalyticsCategories(groupId?: string) {
  return useQuery({
    queryKey: queryKeys.analyticsCategories(groupId),
    queryFn: () => analyticsApi.categories(groupId)
  });
}

export function useAnalyticsGroups() {
  return useQuery({ queryKey: queryKeys.analyticsGroups(), queryFn: analyticsApi.groups });
}

export function useAnalyticsTrends(groupId?: string, months?: number) {
  return useQuery({
    queryKey: queryKeys.analyticsTrends(groupId),
    queryFn: () => analyticsApi.trends(groupId, months)
  });
}
