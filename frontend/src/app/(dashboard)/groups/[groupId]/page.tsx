"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, UserPlus, Wallet, Shuffle } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingSkeleton } from "@/components/common";
import { MemberAvatar } from "@/components/common";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { AddMemberModal } from "@/components/groups/AddMemberModal";
import { useAuth } from "@/hooks/useAuth";
import { useBalances } from "@/hooks/useBalances";
import { useExpenses } from "@/hooks/useExpenses";
import { useGroupMembers } from "@/hooks/useGroups";
import { formatMoney } from "@/lib/formatters/currency";
import { formatDateShort } from "@/lib/formatters/date";
import { Receipt } from "lucide-react";

export default function GroupOverviewPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const { user } = useAuth();
  const { data: balances, isLoading: balancesLoading } = useBalances(groupId);
  const { data: expensesResult, isLoading: expensesLoading } = useExpenses({ group: groupId, limit: 5 });
  const { data: members } = useGroupMembers(groupId);

  const [addExpenseOpen, setAddExpenseOpen] = React.useState(false);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);

  const mine = balances?.find((b) => b.userId === user?.id);
  const currency = "INR";

  return (
    <div className="flex flex-col gap-6">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setAddExpenseOpen(true)}>
          <Plus className="h-4 w-4" />
          Add expense
        </Button>
        <Button variant="secondary" onClick={() => setAddMemberOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add member
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/groups/${groupId}/balances`}>
            <Wallet className="h-4 w-4" />
            View balances
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/groups/${groupId}/balances`}>
            <Shuffle className="h-4 w-4" />
            Simplify debts
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Balance summary */}
        <GlassCard className="p-5">
          <h3 className="text-sm font-medium text-ink-secondary">Your balance</h3>
          {balancesLoading ? (
            <LoadingSkeleton variant="text" count={1} className="mt-2" />
          ) : mine ? (
            <p
              className={
                "mt-1.5 text-2xl font-semibold " +
                (mine.netBalance > 0 ? "text-accent-emerald" : mine.netBalance < 0 ? "text-accent-rose" : "text-ink-primary")
              }
            >
              {mine.netBalance === 0 ? "Settled up" : formatMoney(Math.abs(mine.netBalance), currency)}
            </p>
          ) : (
            <p className="mt-1.5 text-2xl font-semibold text-ink-primary">—</p>
          )}
          <p className="mt-1 text-xs text-ink-muted">
            {mine && mine.netBalance > 0 && "You are owed"}
            {mine && mine.netBalance < 0 && "You owe"}
            {mine && mine.netBalance === 0 && "Nice, no outstanding balance"}
          </p>
        </GlassCard>

        {/* Member summary */}
        <GlassCard className="p-5 lg:col-span-2">
          <h3 className="mb-3 text-sm font-medium text-ink-secondary">Members</h3>
          <div className="flex flex-wrap gap-3">
            {(members ?? []).map((m) => (
              <div key={m.userId} className="flex items-center gap-2 rounded-ctl bg-surface-2 px-2.5 py-1.5">
                <MemberAvatar name={m.name} size="xs" />
                <span className="text-xs font-medium text-ink-primary">{m.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Recent expenses */}
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink-primary">Recent expenses</h3>
          <Link href={`/groups/${groupId}/expenses`} className="text-xs font-medium text-accent-violet hover:underline">
            View all
          </Link>
        </div>
        {expensesLoading && <LoadingSkeleton count={3} />}
        {!expensesLoading && expensesResult?.items.length === 0 && (
          <EmptyState
            icon={<Receipt className="h-5 w-5" />}
            title="No expenses yet"
            description="Add the first expense for this group."
            action={
              <Button onClick={() => setAddExpenseOpen(true)}>
                <Plus className="h-4 w-4" />
                Add expense
              </Button>
            }
          />
        )}
        {!expensesLoading && expensesResult && expensesResult.items.length > 0 && (
          <div className="flex flex-col divide-y divide-line-subtle">
            {expensesResult.items.map((e) => (
              <Link
                key={e.id}
                href={`/expenses/${e.id}`}
                className="focus-ring -mx-2 flex items-center justify-between gap-3 rounded-ctl px-2 py-3 transition-colors hover:bg-surface-2/50 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-primary">{e.title}</p>
                  <p className="text-xs text-ink-secondary">{formatDateShort(e.date)}</p>
                </div>
                <p className="shrink-0 text-sm font-medium text-ink-primary">{formatMoney(e.amount, e.currency)}</p>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>

      <ExpenseFormModal open={addExpenseOpen} onOpenChange={setAddExpenseOpen} groupId={groupId} />
      <AddMemberModal open={addMemberOpen} onOpenChange={setAddMemberOpen} groupId={groupId} />
    </div>
  );
}
