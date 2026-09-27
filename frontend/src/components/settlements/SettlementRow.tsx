"use client";

import * as React from "react";
import { Trash2, ArrowRight } from "lucide-react";
import { MemberAvatar, ConfirmDialog } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteSettlement } from "@/hooks/useSettlements";
import { formatMoney } from "@/lib/formatters/currency";
import { toast } from "sonner";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";
import type { Settlement } from "@/types/settlement";

export function SettlementRow({
  settlement,
  fromName,
  toName,
  groupName
}: {
  settlement: Settlement;
  fromName: string;
  toName: string;
  groupName?: string;
}) {
  const { user } = useAuth();
  const deleteSettlement = useDeleteSettlement(settlement.groupId);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const canDelete = settlement.createdBy === user?._id;

  async function handleDelete() {
    try {
      await deleteSettlement.mutateAsync(settlement._id);
      toast.success("Settlement deleted");
      setConfirmOpen(false);
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't delete this settlement.";
      toast.error(message);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-2.5">
        <MemberAvatar name={fromName} size="sm" />
        <div className="flex items-center gap-1.5 text-sm font-medium text-ink-primary">
          {fromName}
          <ArrowRight className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
          {toName}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-ink-primary">{formatMoney(settlement.amount, settlement.currency)}</p>
          <p className="text-xs text-ink-muted">
            {groupName && `${groupName} · `}
            {settlement.paymentMethod.replace("_", " ")}
          </p>
        </div>
        <Badge variant="emerald">Completed</Badge>
        {canDelete && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirmOpen(true)} aria-label="Delete settlement">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this settlement?"
        description="Balances will be recalculated without this payment. This cannot be undone."
        loading={deleteSettlement.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
