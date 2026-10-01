"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GlassModal, GlassInput, GlassSelect } from "@/components/glass";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCreateSettlement } from "@/hooks/useSettlements";
import { settlementFormSchema, type SettlementFormValues } from "@/lib/validations/settlement";
import { PAYMENT_METHODS } from "@/types/settlement";
import { formatMoney, minorToMajor } from "@/lib/formatters/currency";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";

export interface SettleUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  /** Prefilled from a specific balance row: who the current user owes, and how much (minor units). */
  toUserId: string;
  toUserName: string;
  suggestedAmount: number;
  currency?: string;
}

export function SettleUpModal({
  open,
  onOpenChange,
  groupId,
  toUserId,
  toUserName,
  suggestedAmount,
  currency = "INR"
}: SettleUpModalProps) {
  const { user } = useAuth();
  const createSettlement = useCreateSettlement(groupId);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementFormSchema),
    defaultValues: { toUser: toUserId, amount: minorToMajor(suggestedAmount), paymentMethod: "UPI", note: "" }
  });

  React.useEffect(() => {
    if (open) {
      reset({ toUser: toUserId, amount: minorToMajor(suggestedAmount), paymentMethod: "UPI", note: "" });
    }
  }, [open, toUserId, suggestedAmount, reset]);

  async function onSubmit(values: SettlementFormValues) {
    if (!user) return;
    try {
      await createSettlement.mutateAsync({
        groupId,
        fromUser: user.id,
        toUser: toUserId,
        amount: Math.round(values.amount * 100),
        paymentMethod: values.paymentMethod,
        note: values.note || undefined
      });
      toast.success("Settlement recorded");
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't record this settlement.";
      toast.error(message);
    }
  }

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title="Settle payment"
      description={`You are recording a payment to ${toUserName}.`}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <GlassInput
          label="Amount"
          type="number"
          step="0.01"
          min="0"
          error={errors.amount?.message}
          {...register("amount", { valueAsNumber: true })}
        />
        <p className="-mt-2 text-xs text-ink-muted">Suggested from current balance: {formatMoney(suggestedAmount, currency)}</p>

        <GlassSelect
          label="Payment method"
          value={watch("paymentMethod")}
          onValueChange={(v) => setValue("paymentMethod", v as SettlementFormValues["paymentMethod"])}
          options={PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))}
        />

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settlement-note">Note</Label>
          <Textarea id="settlement-note" placeholder="Optional" {...register("note")} />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Confirm settlement
          </Button>
        </div>
      </form>
    </GlassModal>
  );
}

