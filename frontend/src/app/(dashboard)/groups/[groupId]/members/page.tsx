"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { ErrorState, LoadingSkeleton } from "@/components/common";
import { MemberRow } from "@/components/groups/MemberRow";
import { AddMemberModal } from "@/components/groups/AddMemberModal";
import { useAuth } from "@/hooks/useAuth";
import { useGroupMembers } from "@/hooks/useGroups";

export default function GroupMembersPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const { user } = useAuth();
  const { data: members, isLoading, isError, refetch } = useGroupMembers(groupId);
  const [addOpen, setAddOpen] = React.useState(false);

  const myRole = members?.find((m) => m.userId === user?.id)?.role;
  const canManage = myRole === "OWNER" || myRole === "ADMIN";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add member
          </Button>
        )}
      </div>

      {isLoading && <LoadingSkeleton count={4} />}
      {isError && <ErrorState title="Couldn't load members" onRetry={() => refetch()} />}

      {!isLoading && !isError && members && (
        <GlassCard className="p-5">
          <div className="divide-y divide-line-subtle">
            {members.map((m) => (
              <MemberRow
                key={m.userId}
                groupId={groupId}
                member={m}
                canManage={canManage}
                isCurrentUserOwner={myRole === "OWNER"}
              />
            ))}
          </div>
        </GlassCard>
      )}

      <AddMemberModal open={addOpen} onOpenChange={setAddOpen} groupId={groupId} />
    </div>
  );
}
