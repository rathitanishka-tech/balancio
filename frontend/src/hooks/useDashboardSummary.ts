import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardSummary } from "@/lib/actions/dashboard";

export interface DashboardSummary {
  youOwe: number;
  youAreOwed: number;
  totalSpending: number;
  groupCount: number;
  isLoading: boolean;
  isError: boolean;
}

/**
 * High-performance dashboard summary hook that retrieves all core stats
 * (youOwe, youAreOwed, totalSpending, groupCount) in a single consolidated request.
 */
export function useDashboardSummary(): DashboardSummary {
  const { user } = useAuth();

  const summaryQuery = useQuery({
    queryKey: ["dashboard", "summary", user?.id],
    queryFn: () => getDashboardSummary(),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });

  return {
    youOwe: summaryQuery.data?.youOwe ?? 0,
    youAreOwed: summaryQuery.data?.youAreOwed ?? 0,
    totalSpending: summaryQuery.data?.totalSpending ?? 0,
    groupCount: summaryQuery.data?.groupCount ?? 0,
    isLoading: summaryQuery.isLoading,
    isError: summaryQuery.isError
  };
}
