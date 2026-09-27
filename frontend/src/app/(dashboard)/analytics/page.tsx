"use client";

import * as React from "react";
import { PageHeader, StatCard, ErrorState } from "@/components/common";
import { MonthNavigator } from "@/components/analytics/MonthNavigator";
import { CategoryPieChart } from "@/components/analytics/CategoryPieChart";
import { GroupSpendingChart } from "@/components/analytics/GroupSpendingChart";
import { InsightsList } from "@/components/analytics/InsightsList";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAnalyticsCategories,
  useAnalyticsGroups,
  useAnalyticsMonthly,
  useAnalyticsTrends
} from "@/hooks/useAnalytics";
import { formatMoney } from "@/lib/formatters/currency";
import { Wallet, TrendingUp, HandCoins, PiggyBank } from "lucide-react";

export default function AnalyticsPage() {
  const now = new Date();
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [year, setYear] = React.useState(now.getFullYear());

  const monthly = useAnalyticsMonthly(month, year);
  const categories = useAnalyticsCategories();
  const groups = useAnalyticsGroups();
  const trends = useAnalyticsTrends();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Analytics" description="Where your shared money is actually going." action={<MonthNavigator month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />} />

      {monthly.isError ? (
        <ErrorState title="Couldn't load analytics" onRetry={() => monthly.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {monthly.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : (
            <>
              <StatCard label="Total spending" value={monthly.data?.totalSpending ?? 0} formatValue={(v) => formatMoney(v)} icon={<TrendingUp className="h-4 w-4" />} />
              <StatCard label="Your share" value={monthly.data?.userShare ?? 0} formatValue={(v) => formatMoney(v)} icon={<PiggyBank className="h-4 w-4" />} />
              <StatCard label="You paid" value={monthly.data?.totalPaid ?? 0} formatValue={(v) => formatMoney(v)} tone="positive" icon={<Wallet className="h-4 w-4" />} />
              <StatCard label="You owe" value={monthly.data?.totalOwed ?? 0} formatValue={(v) => formatMoney(v)} tone="negative" icon={<HandCoins className="h-4 w-4" />} />
            </>
          )}
        </div>
      )}

      <SpendingChart />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryPieChart data={categories.data} isLoading={categories.isLoading} isError={categories.isError} onRetry={() => categories.refetch()} />
        <GroupSpendingChart data={groups.data} isLoading={groups.isLoading} isError={groups.isError} onRetry={() => groups.refetch()} />
      </div>

      <InsightsList categories={categories.data} groups={groups.data} trends={trends.data} />
    </div>
  );
}
