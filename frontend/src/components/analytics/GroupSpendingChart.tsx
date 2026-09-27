"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GlassCard } from "@/components/glass";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common";
import { formatMoney } from "@/lib/formatters/currency";
import type { GroupAnalytics } from "@/types/analytics";

export function GroupSpendingChart({
  data,
  isLoading,
  isError,
  onRetry
}: {
  data?: GroupAnalytics[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-base font-semibold text-ink-primary">Spending by group</h3>
      {isLoading && <LoadingSkeleton variant="card" count={1} className="[&>div]:h-56" />}
      {isError && <ErrorState onRetry={onRetry} />}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState title="No group spending yet" description="Join or create a group to see this breakdown." />
      )}
      {!isLoading && !isError && data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis
              stroke="var(--text-muted)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatMoney(v).replace(/\.00$/, "")}
              width={64}
            />
            <Tooltip
              contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: "var(--text-secondary)" }}
              formatter={(value: number) => [formatMoney(value), "Spending"]}
              cursor={{ fill: "var(--surface-2)" }}
            />
            <Bar dataKey="totalSpending" fill="var(--accent-cyan)" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  );
}
