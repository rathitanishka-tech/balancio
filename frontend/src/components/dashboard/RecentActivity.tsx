"use client";

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

export function RecentActivity() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useExpenses({ limit: 6 });
  const { data: groups } = useGroups();

  const groupNameById = new Map((groups ?? []).map((g) => [g.id, g.name]));

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink-primary">Recent activity</h3>
        <Link href="/expenses" className="text-xs font-medium text-accent-violet hover:underline">
          View all
        </Link>
      </div>

      {isLoading && <LoadingSkeleton count={4} />}

      {isError && <ErrorState onRetry={() => refetch()} />}

      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState
          icon={<Receipt className="h-5 w-5" />}
          title="No expenses yet"
          description="Start tracking shared spending by adding your first expense."
        />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <div className="flex flex-col divide-y divide-line-subtle">
          {data.items.map((expense) => {
            const isPayer = expense.paidBy === user?.id;
            return (
              <Link
                key={expense.id}
                href={`/expenses/${expense.id}`}
                className="focus-ring flex items-center justify-between gap-3 py-3 transition-colors hover:bg-surface-2/50 first:pt-0 last:pb-0 rounded-ctl px-2 -mx-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-primary">{expense.title}</p>
                  <p className="truncate text-xs text-ink-secondary">
                    {groupNameById.get(expense.groupId) ?? "Group"} · {isPayer ? "Paid by you" : "Paid by a member"} ·{" "}
                    {formatDateShort(expense.date)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-ink-primary">
                  {formatMoney(expense.amount, expense.currency)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}

