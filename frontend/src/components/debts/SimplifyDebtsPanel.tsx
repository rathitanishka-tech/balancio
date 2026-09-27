"use client";

import * as React from "react";
import { Shuffle, Sparkles } from "lucide-react";
import { GlassCard, LiquidButton } from "@/components/glass";
import { DebtRow } from "@/components/debts/DebtRow";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common";
import { useDirectDebts, useSimplifiedDebts } from "@/hooks/useDebts";
import { useGroup, useGroupMembers } from "@/hooks/useGroups";

/**
 * The spec's flagship interaction (section 33): shows the group's direct
 * debts, and on demand fetches GET /groups/:id/debts/simplified from the
 * backend - the simplified result is never computed in the frontend.
 */
export function SimplifyDebtsPanel({ groupId }: { groupId: string }) {
  const { data: group } = useGroup(groupId);
  const { data: members } = useGroupMembers(groupId);
  const { data: directDebts, isLoading, isError, refetch } = useDirectDebts(groupId);
  const simplified = useSimplifiedDebts(groupId);

  const currency = group?.currency ?? "INR";
  const nameByUserId = new Map((members ?? []).map((m) => [m.userId, m.name]));

  if (isLoading) return <LoadingSkeleton count={3} />;
  if (isError) return <ErrorState title="Couldn't load debts" onRetry={() => refetch()} />;

  const hasDebts = (directDebts ?? []).length > 0;
  const result = simplified.data;

  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink-primary">Who owes whom</h3>
          <p className="text-xs text-ink-secondary">Direct, unsimplified balances between members</p>
        </div>
        {hasDebts && (
          <LiquidButton
            type="button"
            onClick={() => simplified.refetch()}
            loading={simplified.isFetching}
            className="h-10 px-4 text-sm"
          >
            <Shuffle className="h-4 w-4" />
            Simplify debts
          </LiquidButton>
        )}
      </div>

      {!hasDebts && (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="Everyone's settled up"
          description="There's nothing to simplify right now."
        />
      )}

      {hasDebts && !result && (
        <div className="flex flex-col gap-2">
          {(directDebts ?? []).map((d, i) => (
            <DebtRow
              key={`${d.from}-${d.to}`}
              fromName={nameByUserId.get(d.from) ?? "Member"}
              toName={nameByUserId.get(d.to) ?? "Member"}
              amount={d.amount}
              currency={currency}
              style={{ animationDelay: `${i * 60}ms` }}
              explainData={{ groupId, from: d.from, to: d.to, amount: d.amount, name: nameByUserId.get(d.from) }}
            />
          ))}
        </div>
      )}

      {hasDebts && result && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-muted">Before</p>
            <div className="flex flex-col gap-2 opacity-60">
              {(directDebts ?? []).map((d) => (
                <DebtRow
                  key={`${d.from}-${d.to}`}
                  fromName={nameByUserId.get(d.from) ?? "Member"}
                  toName={nameByUserId.get(d.to) ?? "Member"}
                  amount={d.amount}
                  currency={currency}
                  explainData={{ groupId, from: d.from, to: d.to, amount: d.amount, name: nameByUserId.get(d.from) }}
                />
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent-emerald">After</p>
            <div className="flex flex-col gap-2">
              {result.transactions.map((t, i) => (
                <DebtRow
                  key={`${t.from.id}-${t.to.id}`}
                  fromName={t.from.name}
                  toName={t.to.name}
                  amount={t.amount}
                  currency={currency}
                  style={{ animationDelay: `${i * 100}ms` }}
                  explainData={{ groupId, from: t.from.id, to: t.to.id, amount: t.amount, name: t.from.name }}
                />
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="rounded-ctl border border-accent-emerald/25 bg-accent-emerald/[0.06] px-4 py-3 text-center">
              <p className="text-sm font-medium text-accent-emerald">
                {(directDebts ?? []).length} transaction{(directDebts ?? []).length === 1 ? "" : "s"} → {result.transactionCount}{" "}
                transaction{result.transactionCount === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-ink-secondary">Same balances. Fewer payments.</p>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}
