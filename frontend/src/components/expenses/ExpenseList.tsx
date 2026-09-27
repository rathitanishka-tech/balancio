"use client";

import Link from "next/link";
import { GlassCard } from "@/components/glass";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { useGroups } from "@/hooks/useGroups";
import { formatMoney } from "@/lib/formatters/currency";
import { formatDateShort } from "@/lib/formatters/date";
import { Receipt } from "lucide-react";
import type { ExpenseFilters } from "@/types/expense";

export function ExpenseList({ filters, onAddExpense }: { filters: ExpenseFilters; onAddExpense?: () => void }) {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useExpenses(filters);
  const { data: groups } = useGroups();
  const groupNameById = new Map((groups ?? []).map((g) => [g._id, g.name]));

  if (isLoading) return <LoadingSkeleton count={6} />;
  if (isError) return <ErrorState title="Couldn't load expenses" onRetry={() => refetch()} />;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="h-5 w-5" />}
        title="No expenses yet"
        description="Start tracking shared spending by adding your first expense."
        action={
          onAddExpense && (
            <button onClick={onAddExpense} className="text-sm font-medium text-accent-violet hover:underline">
              + Add expense
            </button>
          )
        }
      />
    );
  }

  return (
    <>
      {/* Desktop table */}
      <GlassCard className="hidden overflow-hidden sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-subtle text-left text-xs uppercase tracking-wider text-ink-muted">
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Expense</th>
              <th className="px-5 py-3 font-medium">Group</th>
              <th className="px-5 py-3 font-medium">Paid by</th>
              <th className="px-5 py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((e) => (
              <tr key={e._id} className="border-b border-line-subtle last:border-0 hover:bg-surface-2/40">
                <td className="px-5 py-3 text-ink-secondary">{formatDateShort(e.date)}</td>
                <td className="px-5 py-3">
                  <Link href={`/expenses/${e._id}`} className="font-medium text-ink-primary hover:text-accent-violet">
                    {e.title}
                  </Link>
                  <p className="text-xs text-ink-muted">{e.category}</p>
                </td>
                <td className="px-5 py-3 text-ink-secondary">{groupNameById.get(e.groupId) ?? "—"}</td>
                <td className="px-5 py-3 text-ink-secondary">{e.paidBy === user?._id ? "You" : "Member"}</td>
                <td className="px-5 py-3 text-right font-medium text-ink-primary">{formatMoney(e.amount, e.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 sm:hidden">
        {data.items.map((e) => (
          <Link key={e._id} href={`/expenses/${e._id}`}>
            <GlassCard interactive className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-primary">{e.title}</p>
                  <p className="mt-0.5 text-xs text-ink-secondary">
                    {groupNameById.get(e.groupId) ?? "—"} · {formatDateShort(e.date)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink-primary">{formatMoney(e.amount, e.currency)}</p>
              </div>
            </GlassCard>
          </Link>
        ))}
      </div>
    </>
  );
}
