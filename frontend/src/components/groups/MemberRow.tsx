"use client";

import * as React from "react";
import { MoreVertical, Shield, Trash2 } from "lucide-react";
import { MemberAvatar, ConfirmDialog } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GlassDropdown } from "@/components/glass";
import { useRemoveMember, useUpdateMemberRole } from "@/hooks/useGroups";
import { toast } from "sonner";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";
import type { GroupMember, GroupRole } from "@/types/group";

const ROLE_VARIANT: Record<GroupRole, "violet" | "cyan" | "default"> = {
  OWNER: "violet",
  ADMIN: "cyan",
  MEMBER: "default"
};

export function MemberRow({
  groupId,
  member,
  canManage,
  isCurrentUserOwner
}: {
  groupId: string;
  member: GroupMember;
  canManage: boolean;
  isCurrentUserOwner: boolean;
}) {
  const removeMember = useRemoveMember(groupId);
  const updateRole = useUpdateMemberRole(groupId);
  const [confirmRemove, setConfirmRemove] = React.useState(false);

  async function handleRemove() {
    try {
      await removeMember.mutateAsync(member.userId);
      toast.success("Member removed");
      setConfirmRemove(false);
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't remove this member.";
      toast.error(message);
    }
  }

  async function handleRoleChange(role: GroupRole) {
    try {
      await updateRole.mutateAsync({ userId: member.userId, role });
      toast.success(`${member.name} is now ${role.toLowerCase()}`);
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't update this member's role.";
      toast.error(message);
    }
  }

  const showActions = (canManage && member.role !== "OWNER") || (isCurrentUserOwner && member.role !== "OWNER");

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3">
        <MemberAvatar name={member.name} />
        <div>
          <p className="text-sm font-medium text-ink-primary">{member.name}</p>
          <p className="text-xs text-ink-muted">{member.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={ROLE_VARIANT[member.role]}>{member.role}</Badge>
        {showActions && (
          <GlassDropdown
            trigger={
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
            items={[
              ...(isCurrentUserOwner
                ? [
                    {
                      label: member.role === "ADMIN" ? "Make member" : "Make admin",
                      icon: <Shield className="h-4 w-4" />,
                      onSelect: () => handleRoleChange(member.role === "ADMIN" ? "MEMBER" : "ADMIN")
                    }
                  ]
                : []),
              {
                label: "Remove from group",
                icon: <Trash2 className="h-4 w-4" />,
                onSelect: () => setConfirmRemove(true),
                destructive: true,
                separatorBefore: true
              }
            ]}
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={`Remove ${member.name}?`}
        description="They'll lose access to this group's expenses and balances."
        loading={removeMember.isPending}
        onConfirm={handleRemove}
      />
    </div>
  );
}
