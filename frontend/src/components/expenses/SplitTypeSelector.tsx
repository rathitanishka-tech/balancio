"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { MemberAvatar } from "@/components/common";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { formatMoney } from "@/lib/formatters/currency";
import type { SplitType } from "@/types/expense";

export interface SplitParticipant {
  userId: string;
  name: string;
  avatar?: string;
  included: boolean;
  percentage: number; // 0-100
  shareAmount: number; // major units (rupees)
}

export interface SplitTypeSelectorProps {
  amount: number; // major units (rupees) - 0/NaN if not entered yet
  currency: string;
  splitType: SplitType;
  onSplitTypeChange: (type: SplitType) => void;
  participants: SplitParticipant[];
  onParticipantsChange: (participants: SplitParticipant[]) => void;
}

const TABS: { value: SplitType; label: string }[] = [
  { value: "EQUAL", label: "Equal" },
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "CUSTOM", label: "Custom" }
];

/**
 * This is a LIVE PREVIEW only, mirroring the backend's split algorithm
 * closely enough to show accurate running totals as the user types - it
 * is not the source of truth. The actual shares are always (re)computed
 * server-side from the raw participant input this form submits (see
 * splitwise-backend/src/algorithms/splitCalculation.ts), so this never
 * duplicates the debt/balance calculation logic itself, only the
 * client-side UX of "does this split add up yet".
 */
function equalPreviewShares(amountRupees: number, count: number): number[] {
  if (count === 0 || !Number.isFinite(amountRupees)) return [];
  const amountPaise = Math.round(amountRupees * 100);
  const base = Math.floor(amountPaise / count);
  const remainder = amountPaise - base * count;
  return Array.from({ length: count }, (_, i) => (base + (i < remainder ? 1 : 0)) / 100);
}

export function SplitTypeSelector({
  amount,
  currency,
  splitType,
  onSplitTypeChange,
  participants,
  onParticipantsChange
}: SplitTypeSelectorProps) {
  const included = participants.filter((p) => p.included);
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  const equalShares = React.useMemo(
    () => equalPreviewShares(safeAmount, included.length),
    [safeAmount, included.length]
  );

  const percentageTotal = included.reduce((sum, p) => sum + (p.percentage || 0), 0);
  const customTotal = included.reduce((sum, p) => sum + (p.shareAmount || 0), 0);

  function toggleIncluded(userId: string) {
    onParticipantsChange(
      participants.map((p) => (p.userId === userId ? { ...p, included: !p.included } : p))
    );
  }

  function updatePercentage(userId: string, value: number) {
    onParticipantsChange(participants.map((p) => (p.userId === userId ? { ...p, percentage: value } : p)));
  }

  function updateShareAmount(userId: string, value: number) {
    onParticipantsChange(participants.map((p) => (p.userId === userId ? { ...p, shareAmount: value } : p)));
  }

  function splitEqually() {
    const count = included.length;
    if (count === 0) return;
    const equalPct = Math.round((100 / count) * 100) / 100;
    onParticipantsChange(
      participants.map((p) =>
        p.included ? { ...p, percentage: equalPct, shareAmount: Math.round((safeAmount / count) * 100) / 100 } : p
      )
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex rounded-ctl border border-line-subtle bg-surface-1/60 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onSplitTypeChange(tab.value)}
            className={cn(
              "flex-1 rounded-[8px] px-3 py-1.5 text-sm font-medium transition-all duration-200",
              splitType === tab.value
                ? "bg-surface-2 text-ink-primary shadow-soft"
                : "text-ink-secondary hover:text-ink-primary"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(splitType === "PERCENTAGE" || splitType === "CUSTOM") && (
        <button
          type="button"
          onClick={splitEqually}
          className="self-start text-xs font-medium text-accent-violet hover:underline"
        >
          Split equally instead
        </button>
      )}

      <div className="flex flex-col gap-2">
        {participants.map((p, idx) => (
          <div
            key={p.userId}
            className={cn(
              "flex items-center gap-3 rounded-ctl border border-line-subtle px-3 py-2.5 transition-opacity",
              !p.included && "opacity-40"
            )}
          >
            <button
              type="button"
              onClick={() => toggleIncluded(p.userId)}
              aria-pressed={p.included}
              aria-label={`${p.included ? "Remove" : "Add"} ${p.name} ${p.included ? "from" : "to"} this expense`}
              className={cn(
                "focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
                p.included ? "border-accent-violet bg-accent-violet text-white" : "border-line-strong"
              )}
            >
              {p.included && <Check className="h-3.5 w-3.5" />}
            </button>

            <MemberAvatar name={p.name} avatar={p.avatar} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-primary">{p.name}</span>

            {splitType === "EQUAL" && p.included && (
              <span className="text-sm font-medium text-ink-secondary">
                {formatMoney(Math.round((equalShares[included.indexOf(p)] ?? 0) * 100), currency)}
              </span>
            )}

            {splitType === "PERCENTAGE" && p.included && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={p.percentage}
                  onChange={(e) => updatePercentage(p.userId, Number(e.target.value))}
                  className="h-8 w-20 text-right"
                  aria-label={`${p.name}'s percentage`}
                />
                <span className="w-16 shrink-0 text-right text-xs text-ink-muted">
                  {formatMoney(Math.round((safeAmount * (p.percentage || 0)) / 100) * 100, currency)}
                </span>
              </div>
            )}

            {splitType === "CUSTOM" && p.included && (
              <Input
                type="number"
                min={0}
                step="0.01"
                value={p.shareAmount}
                onChange={(e) => updateShareAmount(p.userId, Number(e.target.value))}
                className="h-8 w-28 text-right"
                aria-label={`${p.name}'s share amount`}
              />
            )}
          </div>
        ))}
      </div>

      <SplitTotalBar
        splitType={splitType}
        amount={safeAmount}
        currency={currency}
        percentageTotal={percentageTotal}
        customTotal={customTotal}
      />
    </div>
  );
}

function SplitTotalBar({
  splitType,
  amount,
  currency,
  percentageTotal,
  customTotal
}: {
  splitType: SplitType;
  amount: number;
  currency: string;
  percentageTotal: number;
  customTotal: number;
}) {
  if (splitType === "EQUAL") {
    return (
      <TotalRow ok label="Split total" value={`${formatMoney(Math.round(amount * 100), currency)} / ${formatMoney(Math.round(amount * 100), currency)}`} />
    );
  }
  if (splitType === "PERCENTAGE") {
    const ok = Math.abs(percentageTotal - 100) < 0.01;
    return <TotalRow ok={ok} label="Total" value={`${percentageTotal.toFixed(1)}%`} />;
  }
  const ok = Math.abs(customTotal - amount) < 0.01;
  return (
    <TotalRow ok={ok} label="Total" value={`${formatMoney(Math.round(customTotal * 100), currency)} / ${formatMoney(Math.round(amount * 100), currency)}`} />
  );
}

function TotalRow({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-ctl border px-3.5 py-2.5 text-sm font-medium",
        ok ? "border-accent-emerald/25 bg-accent-emerald/[0.06] text-accent-emerald" : "border-accent-rose/25 bg-accent-rose/[0.06] text-accent-rose"
      )}
    >
      <span className="text-ink-secondary">{label}</span>
      <span className="flex items-center gap-1.5">
        {value}
        {ok ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </span>
    </div>
  );
}
