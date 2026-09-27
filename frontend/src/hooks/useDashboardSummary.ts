import { useQueries, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { groupsApi } from "@/lib/api/groups";
import { balancesApi } from "@/lib/api/balances";
import { analyticsApi } from "@/lib/api/analytics";
import { queryKeys } from "@/lib/utils/query-keys";

export interface DashboardSummary {
  youOwe: number;
  youAreOwed: number;
  totalSpending: number;
  groupCount: number;
  isLoading: boolean;
  isError: boolean;
}

/**
 * The backend only exposes balances per-group (GET /groups/:id/balances) -
 * there's no single "total you owe across every group" endpoint. Rather
 * than recompute balances ourselves (which would duplicate the backend's
 * debt/balance calculation logic - exactly what the spec says not to do),
 * this simply AGGREGATES the already-backend-computed per-group balances:
 * it fetches each group's balances and sums the current user's netBalance
 * across them. `totalSpending`/`groupCount` come directly from the
 * dedicated analytics endpoint.
 */
export function useDashboardSummary(): DashboardSummary {
  const { user } = useAuth();
  const groupsQuery = useQuery({ queryKey: queryKeys.groups(), queryFn: groupsApi.list });
  const overviewQuery = useQuery({ queryKey: queryKeys.analyticsOverview(), queryFn: analyticsApi.overview });

  const groups = groupsQuery.data ?? [];
  const balanceQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: queryKeys.balances(g._id),
      queryFn: () => balancesApi.getGroupBalances(g._id),
      enabled: groupsQuery.isSuccess
    }))
  });

  const balancesLoaded = balanceQueries.every((q) => q.isSuccess);
  const anyBalanceError = balanceQueries.some((q) => q.isError);

  let youOwe = 0;
  let youAreOwed = 0;
  if (user && balancesLoaded) {
    for (const q of balanceQueries) {
      const mine = q.data?.find((b) => b.userId === user._id);
      if (!mine) continue;
      if (mine.netBalance > 0) youAreOwed += mine.netBalance;
      else if (mine.netBalance < 0) youOwe += Math.abs(mine.netBalance);
    }
  }

  return {
    youOwe,
    youAreOwed,
    totalSpending: overviewQuery.data?.totalSpending ?? 0,
    groupCount: overviewQuery.data?.groupCount ?? groups.length,
    isLoading: groupsQuery.isLoading || overviewQuery.isLoading || (groups.length > 0 && !balancesLoaded && !anyBalanceError),
    isError: groupsQuery.isError || overviewQuery.isError
  };
}
