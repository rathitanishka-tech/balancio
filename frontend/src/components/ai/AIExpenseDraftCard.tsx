import * as React from "react";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatters/currency";
import { Sparkles, Calendar, Receipt, Users, Check, X } from "lucide-react";
import { AIExpenseDraft } from "@/lib/api/ai";

interface AIExpenseDraftCardProps {
  draft: AIExpenseDraft;
  onConfirm: (draft: AIExpenseDraft) => void;
  onCancel: () => void;
  isConfirming?: boolean;
}

export function AIExpenseDraftCard({ draft, onConfirm, onCancel, isConfirming }: AIExpenseDraftCardProps) {
  // We do not submit directly. This card feeds the data back to the parent to populate the form
  // and trigger the actual creation (as per the "AI MUST NEVER DIRECTLY MUTATE DATABASE" rule).
  
  return (
    <GlassCard className="animate-scale-in border-accent-violet/30 p-6 shadow-glow">
      <div className="mb-4 flex items-center gap-2 text-accent-violet">
        <Sparkles className="h-5 w-5" />
        <h3 className="font-semibold tracking-tight">AI Expense Draft</h3>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-2xl font-bold text-ink-primary">
            {draft.amountMinor ? formatMoney(draft.amountMinor) : "Missing Amount"}
          </p>
          <p className="text-sm font-medium text-ink-secondary">{draft.title || "Missing Title"}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-ink-secondary">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-ink-muted" />
            <span>{draft.date || "Missing Date"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-ink-muted" />
            <span>{draft.category || "General"}</span>
          </div>
          <div className="col-span-2 flex items-start gap-2">
            <Users className="h-4 w-4 shrink-0 text-ink-muted" />
            <div>
              <span className="block text-ink-primary">
                Paid by: {draft.paidBy?.name || (draft.paidBy?.type === "CURRENT_USER" ? "You" : "Missing")}
              </span>
              <span className="block">
                Split {draft.splitType?.toLowerCase() || "equal"} with:{" "}
                {draft.participants?.map(p => p.name).join(", ") || "Missing participants"}
              </span>
            </div>
          </div>
        </div>

        {draft.confidence < 0.7 && (
          <div className="rounded-md bg-accent-rose/10 p-3 text-xs text-accent-rose">
            Low confidence in extraction. Please review carefully.
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost" onClick={onCancel} disabled={isConfirming}>
            <X className="mr-2 h-4 w-4" /> Discard
          </Button>
          <Button onClick={() => onConfirm(draft)} loading={isConfirming} className="bg-accent-violet text-white hover:bg-accent-violet/90">
            <Check className="mr-2 h-4 w-4" /> Looks Right
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
