"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/common";
import { useAnalyticsTrends } from "@/hooks/useAnalytics";
import { useExpenses } from "@/hooks/useExpenses";
import { formatMoney, minorToMajor } from "@/lib/formatters/currency";
import { formatMonthKey } from "@/lib/formatters/date";
import { cn } from "@/lib/utils/cn";

type Granularity = "weekly" | "monthly";

function bucketByWeek(expenses: { date: string; amount: number }[]): { label: string; spending: number }[] {
  const now = new Date();
  const weeks: { label: string; start: number; spending: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    weeks.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, start: start.getTime(), spending: 0 });
  }
  for (const e of expenses) {
    const t = new Date(e.date).getTime();
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (t >= weeks[i].start) {
        weeks[i].spending += e.amount;
        break;
      }
    }
  }
  return weeks.map((w) => ({ label: w.label, spending: w.spending }));
}

export function SpendingChart() {
  const [granularity, setGranularity] = React.useState<Granularity>("monthly");
  const trendsQuery = useAnalyticsTrends();
  const expensesQuery = useExpenses({ limit: 100 });

  const monthlyData = (trendsQuery.data ?? []).map((t) => ({
    label: formatMonthKey(t.month),
    spending: minorToMajor(t.totalSpending)
  }));

  const weeklyData = bucketByWeek(expensesQuery.data?.items.map((e) => ({ date: e.date, amount: e.amount })) ?? []).map(
    (w) => ({ label: w.label, spending: minorToMajor(w.spending) })
  );

  const data = granularity === "monthly" ? monthlyData : weeklyData;
  const isLoading = granularity === "monthly" ? trendsQuery.isLoading : expensesQuery.isLoading;

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink-primary">Spending overview</h3>
          <p className="text-xs text-ink-secondary">Across all your groups</p>
        </div>
        <div className="inline-flex rounded-ctl border border-line-subtle bg-surface-1/60 p-1">
          {(["weekly", "monthly"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGranularity(g)}
              className={cn(
                "rounded-[8px] px-3 py-1 text-xs font-medium capitalize transition-colors",
                granularity === g ? "bg-surface-2 text-ink-primary" : "text-ink-muted hover:text-ink-secondary"
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="card" count={1} className="[&>div]:h-64" />
      ) : data.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-ink-muted">No spending data yet.</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="spendingFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C6CF5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#7C6CF5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatMoney(Math.round(v * 100)).replace(/\.00$/, "")}
              width={64}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 12,
                fontSize: 12
              }}
              labelStyle={{ color: "var(--text-secondary)" }}
              formatter={(value: number) => [formatMoney(Math.round(value * 100)), "Spending"]}
            />
            <Area type="monotone" dataKey="spending" stroke="var(--accent-violet)" strokeWidth={2} fill="url(#spendingFill)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  );
}
