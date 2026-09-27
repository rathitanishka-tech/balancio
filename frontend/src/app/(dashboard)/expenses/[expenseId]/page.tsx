"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Paperclip } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MemberAvatar, ConfirmDialog, ErrorState } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { useExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { useGroup, useGroupMembers } from "@/hooks/useGroups";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/formatters/currency";
import { formatDate } from "@/lib/formatters/date";
import { toast } from "sonner";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";

export default function ExpenseDetailPage({ params }: { params: { expenseId: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useExpense(params.expenseId);
  const { data: group } = useGroup(data?.expense.groupId);
  const { data: members } = useGroupMembers(data?.expense.groupId);
  const deleteExpense = useDeleteExpense(data?.expense.groupId);

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const nameByUserId = new Map((members ?? []).map((m) => [m.userId, m.name]));

  async function handleDelete() {
    if (!data) return;
    try {
      await deleteExpense.mutateAsync(data.expense._id);
      toast.success("Expense deleted");
      router.push(`/groups/${data.expense.groupId}/expenses`);
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't delete this expense.";
      toast.error(message);
      setDeleteOpen(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState title="Couldn't load this expense" onRetry={() => refetch()} />;
  }

  const { expense, participants } = data;
  const isCreator = expense.createdBy === user?._id;
  const canEdit = isCreator; // Backend enforces the real rule (creator or group admin); this hides the button for the common case.

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="focus-ring flex w-fit items-center gap-1.5 rounded-ctl text-xs font-medium text-ink-muted hover:text-ink-secondary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <GlassCard className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="default" className="mb-2">
              {expense.category}
            </Badge>
            <h1 className="text-xl font-semibold text-ink-primary">{expense.title}</h1>
            <p className="mt-1 text-2xl font-semibold text-ink-primary">{formatMoney(expense.amount, expense.currency)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit expense">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => setDeleteOpen(true)} aria-label="Delete expense">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {expense.description && <p className="mt-3 text-sm text-ink-secondary">{expense.description}</p>}

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line-subtle pt-5 text-sm">
          <div>
            <p className="text-xs text-ink-muted">Group</p>
            <Link href={`/groups/${expense.groupId}`} className="font-medium text-accent-violet hover:underline">
              {group?.name ?? "—"}
            </Link>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Date</p>
            <p className="font-medium text-ink-primary">{formatDate(expense.date)}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Paid by</p>
            <p className="font-medium text-ink-primary">{nameByUserId.get(expense.paidBy) ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-ink-muted">Split type</p>
            <p className="font-medium capitalize text-ink-primary">{expense.splitType.toLowerCase()}</p>
          </div>
        </div>

        {expense.receipt && (
          <div className="mt-5 flex items-center gap-2 rounded-ctl border border-line-subtle px-3 py-2.5 text-sm text-ink-secondary">
            <Paperclip className="h-4 w-4" />
            Receipt attached
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-3 text-sm font-medium text-ink-secondary">Participants</h2>
        <div className="flex flex-col divide-y divide-line-subtle">
          {participants.map((p) => (
            <div key={p.userId} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <MemberAvatar name={nameByUserId.get(p.userId) ?? "Member"} size="sm" />
                <span className="text-sm font-medium text-ink-primary">{nameByUserId.get(p.userId) ?? "Member"}</span>
                {p.userId === expense.paidBy && (
                  <Badge variant="violet" className="ml-1">
                    Paid
                  </Badge>
                )}
              </div>
              <span className="text-sm font-medium text-ink-primary">{formatMoney(p.shareAmount, expense.currency)}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {canEdit && <ExpenseFormModal open={editOpen} onOpenChange={setEditOpen} editingExpense={data} />}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this expense?"
        description="This action cannot be undone."
        loading={deleteExpense.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
