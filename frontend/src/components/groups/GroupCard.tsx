"use client";

import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { GlassCard, GlassDropdown } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { MemberList } from "@/components/common";
import { useBalances } from "@/hooks/useBalances";
import { useGroupMembers } from "@/hooks/useGroups";
import { useAuth } from "@/hooks/useAuth";
import { formatMoney } from "@/lib/formatters/currency";
import type { Group } from "@/types/group";
import { cn } from "@/lib/utils/cn";

export interface GroupCardProps {
  group: Group;
  onEdit?: () => void;
  onDelete?: () => void;
  canManage?: boolean;
}

export function GroupCard({ group, onEdit, onDelete, canManage }: GroupCardProps) {
  const { user } = useAuth();
  const { data: members } = useGroupMembers(group._id);
  const { data: balances } = useBalances(group._id);

  const totalSpending = balances?.reduce((sum, b) => sum + b.totalPaid, 0) ?? 0;
  const mine = balances?.find((b) => b.userId === user?._id);

  return (
    <GlassCard interactive className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/groups/${group._id}`} className="focus-ring min-w-0 flex-1 rounded-ctl">
          <h3 className="truncate text-base font-semibold text-ink-primary">{group.name}</h3>
          <p className="mt-0.5 text-xs text-ink-secondary">{members?.length ?? 0} members</p>
        </Link>
        {canManage && (onEdit || onDelete) && (
          <GlassDropdown
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
            items={[
              ...(onEdit ? [{ label: "Edit", icon: <Pencil className="h-4 w-4" />, onSelect: onEdit }] : []),
              ...(onDelete
                ? [{ label: "Delete", icon: <Trash2 className="h-4 w-4" />, onSelect: onDelete, destructive: true }]
                : [])
            ]}
          />
        )}
      </div>

      <Link href={`/groups/${group._id}`} className="focus-ring mt-4 flex-1 rounded-ctl">
        <p className="text-lg font-semibold text-ink-primary">{formatMoney(totalSpending, group.currency)}</p>
        <p className="text-xs text-ink-secondary">total spent</p>

        {mine && mine.netBalance !== 0 && (
          <p className={cn("mt-3 text-sm font-medium", mine.netBalance > 0 ? "text-accent-emerald" : "text-accent-rose")}>
            {mine.netBalance > 0 ? "You are owed " : "You owe "}
            {formatMoney(Math.abs(mine.netBalance), group.currency)}
          </p>
        )}
        {mine && mine.netBalance === 0 && <p className="mt-3 text-sm font-medium text-ink-secondary">Settled up ✓</p>}
      </Link>

      {members && members.length > 0 && (
        <MemberList
          className="mt-4"
          members={members.map((m) => ({ userId: m.userId, name: m.name }))}
        />
      )}
    </GlassCard>
  );
}
