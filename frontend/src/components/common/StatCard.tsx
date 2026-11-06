"use client";

import * as React from "react";
import { GlassCard } from "@/components/glass";
import { cn } from "@/lib/utils/cn";
import { CountUp } from "@/components/common/CountUp";

export interface StatCardProps {
  label: string;
  value: number;
  formatValue?: (value: number) => string;
  icon?: React.ReactNode;
  trend?: { direction: "up" | "down"; label: string };
  tone?: "default" | "positive" | "negative";
  className?: string;
}

const TONE_STYLES: Record<NonNullable<StatCardProps["tone"]>, string> = {
  default: "text-ink-primary",
  positive: "text-accent-emerald",
  negative: "text-accent-rose"
};

/**
 * The dashboard/analytics/balances headline metric card ("You owe ₹1,240",
 * "Total spending ₹18,450", etc). Never receives a hardcoded number -
 * every usage passes real data from a hook.
 */
export function StatCard({ label, value, formatValue, icon, trend, tone = "default", className }: StatCardProps) {
  return (
    <GlassCard interactive className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-secondary truncate">{label}</p>
          <p className={cn("mt-1.5 text-xl sm:text-2xl font-semibold tracking-tight tabular-nums break-words", TONE_STYLES[tone])}>
            <CountUp value={value} formatValue={formatValue} />
          </p>
          {trend && (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-xs truncate",
                trend.direction === "up" ? "text-accent-emerald" : "text-accent-rose"
              )}
            >
              <span aria-hidden="true">{trend.direction === "up" ? "↑" : "↓"}</span>
              {trend.label}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl bg-surface-2 text-ink-secondary">
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
