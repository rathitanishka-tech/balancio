"use client";

import * as React from "react";
import { GlassCard } from "@/components/glass";
import { BalanceRow } from "@/components/balances/BalanceRow";
import { StatCard, EmptyState, ErrorState, LoadingSkeleton } from "@/components/common";
import { SettleUpModal } from "@/components/settlements/SettleUpModal";
import { useAuth } from "@/hooks/useAuth";
import { useBalances } from "@/hooks/useBalances";
import { useDirectDebts } from "@/hooks/useDebts";
import { useGroup } from "@/hooks/useGroups";
import { formatMoney } from "@/lib/formatters/currency";
import { HandCoins, Wallet } from "lucide-react";

export function BalanceOverview({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const { data: group } = useGroup(groupId);
  const { data: balances, isLoading: balancesLoading, isError: balancesError, refetch: refetchBalances } = useBalances(groupId);
  const { data: debts, isLoading: debtsLoading, isError: debtsError, refetch: refetchDebts } = useDirectDebts(groupId);

  const [settleTarget, setSettleTarget] = React.useState<{ userId: string; name: string; amount: number } | null>(null);

  const currency = group?.currency ?? "INR";
  const nameByUserId = new Map((balances ?? []).map((b) => [b.userId, b.name]));

  const isLoading = balancesLoading || debtsLoading;
  const isError = balancesError || debtsError;

  if (isLoading) return <LoadingSkeleton count={4} />;
  if (isError) {
    return (
      <ErrorState
        title="Couldn't load balances"
        onRetry={() => {
          refetchBalances();
          refetchDebts();
        }}
      />
    );
  }

  const youOweRows = (debts ?? []).filter((d) => d.from === user?._id);
  const youAreOwedRows = (debts ?? []).filter((d) => d.to === user?._id);

  const totalYouOwe = youOweRows.reduce((sum, d) => sum + d.amount, 0);
  const totalYouAreOwed = youAreOwedRows.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="You owe" value={totalYouOwe} formatValue={(v) => formatMoney(v, currency)} tone="negative" icon={<HandCoins className="h-4 w-4" />} />
        <StatCard label="You are owed" value={totalYouAreOwed} formatValue={(v) => formatMoney(v, currency)} tone="positive" icon={<Wallet className="h-4 w-4" />} />
      </div>

      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-ink-secondary">You owe</h3>
        {youOweRows.length === 0 ? (
          <EmptyState className="border-none py-6" title="Nothing owed" description="You're all settled up here." />
        ) : (
          <div className="mt-1 divide-y divide-line-subtle">
            {youOweRows.map((d) => (
              <BalanceRow
                key={d.to}
                name={nameByUserId.get(d.to) ?? "Member"}
                amount={d.amount}
                currency={currency}
                direction="owe"
                explainData={{ groupId, from: user?._id, to: d.to, amount: d.amount, name: nameByUserId.get(d.to) }}
                onSettle={() => setSettleTarget({ userId: d.to, name: nameByUserId.get(d.to) ?? "Member", amount: d.amount })}
              />
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5">
        <h3 className="text-sm font-medium text-ink-secondary">You are owed</h3>
        {youAreOwedRows.length === 0 ? (
          <EmptyState className="border-none py-6" title="Nothing pending" description="No one owes you in this group right now." />
        ) : (
          <div className="mt-1 divide-y divide-line-subtle">
            {youAreOwedRows.map((d) => (
              <BalanceRow 
                key={d.from} 
                name={nameByUserId.get(d.from) ?? "Member"} 
                amount={d.amount} 
                currency={currency} 
                direction="owed" 
                explainData={{ groupId, from: d.from, to: user?._id, amount: d.amount, name: nameByUserId.get(d.from) }}
              />
            ))}
          </div>
        )}
      </GlassCard>

      {settleTarget && (
        <SettleUpModal
          open={Boolean(settleTarget)}
          onOpenChange={(open) => !open && setSettleTarget(null)}
          groupId={groupId}
          toUserId={settleTarget.userId}
          toUserName={settleTarget.name}
          suggestedAmount={settleTarget.amount}
          currency={currency}
        />
      )}
    </div>
  );
}
