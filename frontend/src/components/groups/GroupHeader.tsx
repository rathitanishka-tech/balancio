"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { GlassDropdown } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common";
import { GroupFormModal } from "@/components/groups/GroupFormModal";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteGroup, useGroupMembers } from "@/hooks/useGroups";
import { useBalances } from "@/hooks/useBalances";
import { formatMoney } from "@/lib/formatters/currency";
import { toast } from "sonner";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";
import type { Group } from "@/types/group";

export function GroupHeader({ group }: { group: Group }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: members } = useGroupMembers(group._id);
  const { data: balances } = useBalances(group._id);
  const deleteGroup = useDeleteGroup();

  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const myRole = members?.find((m) => m.userId === user?._id)?.role;
  const isOwner = myRole === "OWNER";
  const totalSpending = balances?.reduce((sum, b) => sum + b.totalPaid, 0) ?? 0;

  async function handleDelete() {
    try {
      await deleteGroup.mutateAsync(group._id);
      toast.success("Group deleted");
      router.push("/groups");
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't delete this group.";
      toast.error(message);
      setDeleteOpen(false);
    }
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">{group.name}</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          {members?.length ?? 0} members · {formatMoney(totalSpending, group.currency)} total spending
        </p>
      </div>

      <GlassDropdown
        trigger={
          <Button variant="secondary" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        }
        items={[
          { label: "Edit group", icon: <Pencil className="h-4 w-4" />, onSelect: () => setEditOpen(true) },
          ...(isOwner
            ? [
                {
                  label: "Delete group",
                  icon: <Trash2 className="h-4 w-4" />,
                  onSelect: () => setDeleteOpen(true),
                  destructive: true,
                  separatorBefore: true
                }
              ]
            : [])
        ]}
      />

      <GroupFormModal open={editOpen} onOpenChange={setEditOpen} group={group} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this group?"
        description="This will permanently delete the group and its expense history. This action cannot be undone."
        loading={deleteGroup.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
