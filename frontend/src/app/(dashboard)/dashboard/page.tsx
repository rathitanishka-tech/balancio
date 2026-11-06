"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Wallet, TrendingUp, Users, HandCoins } from "lucide-react";
import { PageHeader, StatCard, ErrorState, LoadingSkeleton } from "@/components/common";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { formatMoney } from "@/lib/formatters/currency";

// Code-split Recharts bundle to prevent blocking initial dashboard paint and DOMContentLoaded
const SpendingChart = dynamic(
  () => import("@/components/dashboard/SpendingChart").then((mod) => mod.SpendingChart),
  {
    ssr: false,
    loading: () => <LoadingSkeleton variant="card" count={1} className="[&>div]:h-72" />
  }
);

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const summary = useDashboardSummary();

  if (summary.isLoading) return <DashboardSkeleton />;
  if (summary.isError) return <ErrorState title="Couldn't load your dashboard" />;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`${greeting()}, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Here's what's happening with your expenses."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="You owe" value={summary.youOwe} formatValue={(v) => formatMoney(v)} tone="negative" icon={<HandCoins className="h-4 w-4" />} />
        <StatCard label="You are owed" value={summary.youAreOwed} formatValue={(v) => formatMoney(v)} tone="positive" icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Total spending" value={summary.totalSpending} formatValue={(v) => formatMoney(v)} icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Groups" value={summary.groupCount} icon={<Users className="h-4 w-4" />} />
      </div>

      <SpendingChart />
      <RecentActivity />
    </div>
  );
}
