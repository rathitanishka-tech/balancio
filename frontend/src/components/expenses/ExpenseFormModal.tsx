"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { GlassModal, GlassInput, GlassSelect } from "@/components/glass";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SplitTypeSelector, type SplitParticipant } from "@/components/expenses/SplitTypeSelector";
import { useAuth } from "@/hooks/useAuth";
import { useGroups, useGroupMembers } from "@/hooks/useGroups";
import { useCreateExpense, useUpdateExpense } from "@/hooks/useExpenses";
import { EXPENSE_CATEGORIES, type Expense, type ExpenseParticipant, type SplitType } from "@/types/expense";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";
import { minorToMajor } from "@/lib/formatters/currency";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIExpenseAssistant } from "@/components/ai/AIExpenseAssistant";
import { AIExpenseDraftCard } from "@/components/ai/AIExpenseDraftCard";
import { ReceiptScanner } from "@/components/ai/ReceiptScanner";
import { AIExpenseDraft } from "@/lib/api/ai";

interface ScalarFields {
  title: string;
  amount: number;
  date: string;
  category: string;
  paidBy: string;
  notes: string;
}

export interface ExpenseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId?: string;
  editingExpense?: { expense: Expense; participants: ExpenseParticipant[] };
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseFormModal({ open, onOpenChange, groupId, editingExpense }: ExpenseFormModalProps) {
  const { user } = useAuth();
  const isEditing = Boolean(editingExpense);

  const { data: groups } = useGroups();
  const [selectedGroupId, setSelectedGroupId] = React.useState(groupId ?? editingExpense?.expense.groupId ?? "");
  const { data: members } = useGroupMembers(selectedGroupId || undefined);

  const [splitType, setSplitType] = React.useState<SplitType>(editingExpense?.expense.splitType ?? "EQUAL");
  const [participants, setParticipants] = React.useState<SplitParticipant[]>([]);
  const [participantsError, setParticipantsError] = React.useState<string | null>(null);
  const [initializedForGroup, setInitializedForGroup] = React.useState<string | null>(null);

  const [activeTab, setActiveTab] = React.useState("manual");
  const [aiDraft, setAiDraft] = React.useState<AIExpenseDraft | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ScalarFields>({
    defaultValues: {
      title: editingExpense?.expense.title ?? "",
      amount: editingExpense ? minorToMajor(editingExpense.expense.amount) : undefined,
      date: editingExpense?.expense.date.slice(0, 10) ?? today(),
      category: editingExpense?.expense.category ?? "General",
      paidBy: editingExpense?.expense.paidBy ?? user?._id ?? "",
      notes: editingExpense?.expense.description ?? ""
    }
  });

  const amount = watch("amount");
  const currency = groups?.find((g) => g._id === selectedGroupId)?.currency ?? "INR";

  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense(editingExpense?.expense._id ?? "", selectedGroupId);
  const isSubmitting = createExpense.isPending || updateExpense.isPending;

  React.useEffect(() => {
    if (!open) return;
    setSelectedGroupId(groupId ?? editingExpense?.expense.groupId ?? "");
    setSplitType(editingExpense?.expense.splitType ?? "EQUAL");
    setInitializedForGroup(null);
    setParticipantsError(null);
    setActiveTab("manual");
    setAiDraft(null);
    reset({
      title: editingExpense?.expense.title ?? "",
      amount: editingExpense ? minorToMajor(editingExpense.expense.amount) : undefined,
      date: editingExpense?.expense.date.slice(0, 10) ?? today(),
      category: editingExpense?.expense.category ?? "General",
      paidBy: editingExpense?.expense.paidBy ?? user?._id ?? "",
      notes: editingExpense?.expense.description ?? ""
    });
  }, [open, groupId, editingExpense]);

  React.useEffect(() => {
    if (!members || !selectedGroupId || initializedForGroup === selectedGroupId) return;

    const existingByUser = new Map((editingExpense?.participants ?? []).map((p) => [p.userId, p]));

    setParticipants(
      members.map((m) => {
        const existing = existingByUser.get(m.userId);
        return {
          userId: m.userId,
          name: m.name,
          included: editingExpense ? Boolean(existing) : true,
          percentage: existing?.percentage ?? Math.round((100 / members.length) * 100) / 100,
          shareAmount: existing ? minorToMajor(existing.shareAmount) : 0
        };
      })
    );
    setInitializedForGroup(selectedGroupId);
  }, [members, selectedGroupId]);

  function validateSplit(): boolean {
    const included = participants.filter((p) => p.included);
    if (included.length === 0) {
      setParticipantsError("Select at least one participant");
      return false;
    }
    if (splitType === "PERCENTAGE") {
      const total = included.reduce((s, p) => s + (p.percentage || 0), 0);
      if (Math.abs(total - 100) > 0.05) {
        setParticipantsError(`Percentages must add up to 100 (currently ${total.toFixed(1)})`);
        return false;
      }
    }
    if (splitType === "CUSTOM") {
      const total = included.reduce((s, p) => s + (p.shareAmount || 0), 0);
      if (Math.abs(total - (amount || 0)) > 0.01) {
        setParticipantsError(`Custom shares must add up to the total amount`);
        return false;
      }
    }
    setParticipantsError(null);
    return true;
  }

  async function onSubmit(values: ScalarFields) {
    if (!selectedGroupId) {
      toast.error("Pick a group for this expense.");
      return;
    }
    if (!validateSplit()) return;

    const included = participants.filter((p) => p.included);
    const payload = {
      groupId: selectedGroupId,
      title: values.title,
      description: values.notes || undefined,
      amount: Math.round(values.amount * 100),
      category: values.category,
      paidBy: values.paidBy,
      splitType,
      date: new Date(values.date).toISOString(),
      participants: included.map((p) => ({
        userId: p.userId,
        percentage: splitType === "PERCENTAGE" ? p.percentage : undefined,
        shareAmount: splitType === "CUSTOM" ? Math.round(p.shareAmount * 100) : undefined
      }))
    };

    try {
      if (isEditing && editingExpense) {
        await updateExpense.mutateAsync(payload);
        toast.success("Expense updated");
      } else {
        await createExpense.mutateAsync(payload);
        toast.success("Expense added");
      }
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't save this expense.";
      toast.error(message);
    }
  }

  function handleDraftConfirm(draft: AIExpenseDraft) {
    if (draft.title) setValue("title", draft.title);
    if (draft.amountMinor) setValue("amount", minorToMajor(draft.amountMinor));
    if (draft.date) setValue("date", draft.date.slice(0, 10));
    
    if (draft.category) {
      const formattedCategory = draft.category.charAt(0) + draft.category.slice(1).toLowerCase();
      if (EXPENSE_CATEGORIES.includes(formattedCategory as any)) {
        setValue("category", formattedCategory);
      }
    }

    if (draft.paidBy?.type === "CURRENT_USER" && user) {
      setValue("paidBy", user._id);
    } else if (draft.paidBy?.name && members) {
      const member = members.find(m => m.name.toLowerCase().includes(draft.paidBy!.name!.toLowerCase()));
      if (member) setValue("paidBy", member.userId);
    }

    if (draft.splitType) {
       setSplitType(draft.splitType as SplitType);
    }

    setAiDraft(null);
    setActiveTab("manual");
    toast.success("AI draft applied! Review and click Save.");
  }

  const groupLocked = Boolean(groupId) || isEditing;

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "Edit expense" : "Add expense"}
      description="The backend calculates the final shares - you just describe how to split it."
      className="max-w-2xl"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {!isEditing && (
          <TabsList className="mb-4 grid w-full grid-cols-3 bg-surface-1">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="ai" className="text-accent-violet data-[state=active]:text-accent-violet">
              ✨ AI
            </TabsTrigger>
            <TabsTrigger value="receipt" className="text-accent-blue data-[state=active]:text-accent-blue">
              📷 Receipt
            </TabsTrigger>
          </TabsList>
        )}
        
        <TabsContent value="manual">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-muted">Expense details</legend>
              <GlassInput label="Title" placeholder="Dinner at the beach shack" error={errors.title?.message} {...register("title", { required: "Give this expense a title" })} />
              <div className="grid grid-cols-2 gap-4">
                <GlassInput
                  label="Amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  error={errors.amount?.message}
                  {...register("amount", { required: "Enter an amount", valueAsNumber: true, min: { value: 0.01, message: "Must be more than zero" } })}
                />
                <GlassInput label="Date" type="date" error={errors.date?.message} {...register("date", { required: "Pick a date" })} />
              </div>
              <GlassSelect
                label="Category"
                value={watch("category")}
                onValueChange={(v) => setValue("category", v)}
                options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
            </fieldset>

            <fieldset className="flex flex-col gap-4">
              <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-muted">Payment</legend>
              {!groupLocked && (
                <GlassSelect
                  label="Group"
                  placeholder="Choose a group"
                  value={selectedGroupId}
                  onValueChange={setSelectedGroupId}
                  options={(groups ?? []).map((g) => ({ value: g._id, label: g.name }))}
                />
              )}
              <GlassSelect
                label="Paid by"
                value={watch("paidBy")}
                onValueChange={(v) => setValue("paidBy", v)}
                options={(members ?? []).map((m) => ({ value: m.userId, label: m.name }))}
                placeholder="Who paid?"
              />
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-muted">
                Participants &amp; split
              </legend>
              {!selectedGroupId ? (
                <p className="text-sm text-ink-muted">Choose a group to pick participants.</p>
              ) : (
                <SplitTypeSelector
                  amount={amount}
                  currency={currency}
                  splitType={splitType}
                  onSplitTypeChange={setSplitType}
                  participants={participants}
                  onParticipantsChange={setParticipants}
                />
              )}
              {participantsError && (
                <p role="alert" className="text-xs text-accent-rose">
                  {participantsError}
                </p>
              )}
            </fieldset>

            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-xs font-medium uppercase tracking-wider text-ink-muted">
                Additional information
              </legend>
              <Label htmlFor="expense-notes">Notes</Label>
              <Textarea id="expense-notes" placeholder="Optional" {...register("notes")} />
            </fieldset>

            <div className="flex flex-col-reverse gap-2 border-t border-line-subtle pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting}>
                {isEditing ? "Save changes" : "Add expense"}
              </Button>
            </div>
          </form>
        </TabsContent>
        
        <TabsContent value="ai">
          {!selectedGroupId ? (
             <div className="py-8 text-center text-ink-muted">
               Please select a Group in the Manual tab first so I know who is involved!
             </div>
          ) : aiDraft ? (
            <AIExpenseDraftCard 
              draft={aiDraft} 
              onConfirm={handleDraftConfirm} 
              onCancel={() => setAiDraft(null)} 
            />
          ) : (
            <AIExpenseAssistant 
              onDraftGenerated={setAiDraft} 
              groupMembers={members?.map(m => m.name)} 
            />
          )}
        </TabsContent>
        
        <TabsContent value="receipt">
          {!selectedGroupId ? (
             <div className="py-8 text-center text-ink-muted">
               Please select a Group in the Manual tab first so I know who is involved!
             </div>
          ) : aiDraft ? (
            <AIExpenseDraftCard 
              draft={aiDraft} 
              onConfirm={handleDraftConfirm} 
              onCancel={() => setAiDraft(null)} 
            />
          ) : (
            <ReceiptScanner 
              onDraftGenerated={setAiDraft} 
            />
          )}
        </TabsContent>
      </Tabs>
    </GlassModal>
  );
}
