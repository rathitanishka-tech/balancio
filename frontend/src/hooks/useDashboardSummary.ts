import { useQueries, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getUserGroups } from "@/lib/actions/groups";
import { getGroupBalances } from "@/lib/actions/balances";
import { getDashboardOverview } from "@/lib/actions/dashboard";
import { queryKeys } from "@/lib/utils/query-keys";

export interface DashboardSummary {
  youOwe: number;
  youAreOwed: number;
  totalSpending: number;
  groupCount: number;
  isLoading: boolean;
  isError: boolean;
}

export function useDashboardSummary(): DashboardSummary {
  const { user } = useAuth();
  const groupsQuery = useQuery({ queryKey: queryKeys.groups(), queryFn: () => getUserGroups() });
  const overviewQuery = useQuery({ queryKey: queryKeys.analyticsOverview(), queryFn: () => getDashboardOverview() });

  const groups = groupsQuery.data ?? [];
  const balanceQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: queryKeys.balances(g.id),
      queryFn: () => getGroupBalances(g.id),
      enabled: groupsQuery.isSuccess
    }))
  });

  const balancesLoaded = balanceQueries.every((q) => q.isSuccess);
  const anyBalanceError = balanceQueries.some((q) => q.isError);

  let youOwe = 0;
  let youAreOwed = 0;
  if (user && balancesLoaded) {
    for (const q of balanceQueries) {
      const mine = q.data?.find((b) => b.userId === user.id);
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

