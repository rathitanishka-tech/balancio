"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { GlassCard } from "@/components/glass";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common";
import { formatMoney } from "@/lib/formatters/currency";
import type { CategoryAnalytics } from "@/types/analytics";

const COLORS = ["#7C6CF5", "#22D3EE", "#34D399", "#60A5FA", "#FB7185", "#F5C451", "#A78BFA"];

export function CategoryPieChart({
  data,
  isLoading,
  isError,
  onRetry
}: {
  data?: CategoryAnalytics[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  return (
    <GlassCard className="p-5">
      <h3 className="mb-4 text-base font-semibold text-ink-primary">Category distribution</h3>
      {isLoading && <LoadingSkeleton variant="card" count={1} className="[&>div]:h-56" />}
      {isError && <ErrorState onRetry={onRetry} />}
      {!isLoading && !isError && (!data || data.length === 0) && (
        <EmptyState title="No categorized spending yet" description="Add expenses to see a breakdown by category." />
      )}
      {!isLoading && !isError && data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="totalSpending"
              nameKey="category"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.category} fill={COLORS[i % COLORS.length]} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "var(--surface-2)", border: "1px solid var(--border-subtle)", borderRadius: 12, fontSize: 12 }}
              itemStyle={{ color: "var(--text-primary)" }}
              formatter={(value: number, name: string) => [formatMoney(value), name]}
            />
            <Legend
              formatter={(value) => <span className="text-xs text-ink-secondary">{value}</span>}
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </GlassCard>
  );
}
