import { MemberAvatar } from "@/components/common";
import { formatMoney } from "@/lib/formatters/currency";
import { ArrowRight } from "lucide-react";
import { DebtExplanationDialog } from "@/components/ai/DebtExplanationDialog";

export interface DebtRowProps {
  fromName: string;
  toName: string;
  amount: number;
  currency?: string;
  style?: React.CSSProperties;
  explainData?: any;
}

export function DebtRow({ fromName, toName, amount, currency = "INR", style, explainData }: DebtRowProps) {
  return (
    <div
      className="flex animate-fade-in items-center justify-between gap-3 rounded-ctl border border-line-subtle px-3.5 py-2.5"
      style={style}
    >
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <MemberAvatar name={fromName} size="xs" />
        <span className="truncate font-medium text-ink-primary">{fromName}</span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
        <MemberAvatar name={toName} size="xs" />
        <span className="truncate font-medium text-ink-primary">{toName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-sm font-semibold text-ink-primary">{formatMoney(amount, currency)}</span>
        {explainData && (
          <DebtExplanationDialog debtData={explainData} />
        )}
      </div>
    </div>
  );
}
