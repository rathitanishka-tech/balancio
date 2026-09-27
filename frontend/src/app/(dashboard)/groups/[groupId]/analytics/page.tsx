"use client";

import { CategoryPieChart } from "@/components/analytics/CategoryPieChart";
import { InsightsList } from "@/components/analytics/InsightsList";
import { StatCard } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyticsCategories, useAnalyticsTrends } from "@/hooks/useAnalytics";
import { useBalances } from "@/hooks/useBalances";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/formatters/currency";
import { TrendingUp, PiggyBank } from "lucide-react";

export default function GroupAnalyticsPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const { user } = useAuth();
  const categories = useAnalyticsCategories(groupId);
  const trends = useAnalyticsTrends(groupId);
  const { data: balances, isLoading: balancesLoading } = useBalances(groupId);

  const mine = balances?.find((b) => b.userId === user?._id);
  const totalSpending = balances?.reduce((sum, b) => sum + b.totalPaid, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        {balancesLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <StatCard label="Total spending" value={totalSpending} formatValue={(v) => formatMoney(v)} icon={<TrendingUp className="h-4 w-4" />} />
            <StatCard label="Your share" value={mine?.totalOwed ?? 0} formatValue={(v) => formatMoney(v)} icon={<PiggyBank className="h-4 w-4" />} />
          </>
        )}
      </div>

      <CategoryPieChart data={categories.data} isLoading={categories.isLoading} isError={categories.isError} onRetry={() => categories.refetch()} />
      <InsightsList categories={categories.data} trends={trends.data} />
    </div>
  );
}
