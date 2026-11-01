"use client";

import * as React from "react";
import Link from "next/link";
import { GlassCard } from "@/components/glass";
import { EmptyState, ErrorState } from "@/components/common";
import { LoadingSkeleton } from "@/components/common";
import { useExpenses } from "@/hooks/useExpenses";
import { useGroups } from "@/hooks/useGroups";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/formatters/currency";
import { formatDateShort } from "@/lib/formatters/date";
import { Receipt } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ActivityItem {
  id: string;
  title: string;
  groupName: string;
  isPayer: boolean;
  date: string;
  amount: number;
  currency?: string;
  href?: string;
}

export interface RecentActivityViewProps {
  items: ActivityItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  className?: string;
  viewAllHref?: string;
}

/** Pure presentational component that can be safely used in both the dashboard and the public landing hero preview */
export function RecentActivityView({
  items,
  isLoading = false,
  isError = false,
  onRetry,
  className,
  viewAllHref = "/expenses"
}: RecentActivityViewProps) {
  return (
    <GlassCard className={cn("p-5", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink-primary">Recent activity</h3>
        <Link href={viewAllHref} className="text-xs font-medium text-accent-violet hover:underline">
          View all
        </Link>
      </div>

      {isLoading && <LoadingSkeleton count={4} />}

      {isError && <ErrorState onRetry={onRetry} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          icon={<Receipt className="h-5 w-5" />}
          title="No expenses yet"
          description="Start tracking shared spending by adding your first expense."
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="flex flex-col divide-y divide-line-subtle">
          {items.map((expense) => (
            <Link
              key={expense.id}
              href={expense.href ?? `/expenses/${expense.id}`}
              className="focus-ring flex items-center justify-between gap-3 py-3 transition-colors hover:bg-surface-2/50 first:pt-0 last:pb-0 rounded-ctl px-2 -mx-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-primary">{expense.title}</p>
                <p className="truncate text-xs text-ink-secondary">
                  {expense.groupName} · {expense.isPayer ? "Paid by you" : "Paid by a member"} ·{" "}
                  {formatDateShort(expense.date)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-ink-primary">
                {formatMoney(expense.amount, expense.currency)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </GlassCard>
  );
}

/** Authenticated container connected to live React Query expense & group hooks */
export function RecentActivity() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useExpenses({ limit: 6 });
  const { data: groups } = useGroups();

  const groupNameById = new Map((groups ?? []).map((g) => [g.id, g.name]));

  const items: ActivityItem[] = (data?.items ?? []).map((expense) => ({
    id: expense.id,
    title: expense.title,
    groupName: groupNameById.get(expense.groupId) ?? "Group",
    isPayer: expense.paidBy === user?.id,
    date: expense.date,
    amount: expense.amount,
    currency: expense.currency
  }));

  return (
    <RecentActivityView
      items={items}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
    />
  );
}
