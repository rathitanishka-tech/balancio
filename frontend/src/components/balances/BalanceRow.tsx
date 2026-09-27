import { MemberAvatar } from "@/components/common";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatters/currency";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { DebtExplanationDialog } from "@/components/ai/DebtExplanationDialog";

export interface BalanceRowProps {
  name: string;
  amount: number;
  currency?: string;
  direction: "owe" | "owed";
  explainData?: any;
  onSettle?: () => void;
}

export function BalanceRow({ name, amount, currency = "INR", direction, explainData, onSettle }: BalanceRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <MemberAvatar name={name} size="sm" />
        <span className="text-sm font-medium text-ink-primary">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={
            "flex items-center gap-1 text-sm font-semibold " +
            (direction === "owed" ? "text-accent-emerald" : "text-accent-rose")
          }
        >
          {direction === "owed" ? (
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {formatMoney(amount, currency)}
        </span>
        
        {explainData && (
          <DebtExplanationDialog debtData={explainData} />
        )}

        {direction === "owe" && onSettle && (
          <Button size="sm" variant="secondary" onClick={onSettle}>
            Settle
          </Button>
        )}
      </div>
    </div>
  );
}
