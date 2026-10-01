"use client";

import * as React from "react";
import { Plus, Search, Users } from "lucide-react";
import { PageHeader, EmptyState, ErrorState } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GroupCard } from "@/components/groups/GroupCard";
import { GroupsGridSkeleton } from "@/components/groups/GroupSkeleton";
import { GroupFormModal } from "@/components/groups/GroupFormModal";
import { useGroups } from "@/hooks/useGroups";

export default function GroupsPage() {
  const { data: groups, isLoading, isError, refetch } = useGroups();
  const [query, setQuery] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);

  const filtered = (groups ?? []).filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Groups"
        description="Everyone you're sharing expenses with."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Create group
          </Button>
        }
      />

      {!isLoading && !isError && (groups?.length ?? 0) > 0 && (
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            placeholder="Search groups…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {isLoading && <GroupsGridSkeleton />}

      {isError && <ErrorState title="Couldn't load your groups" onRetry={() => refetch()} />}

      {!isLoading && !isError && groups?.length === 0 && (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No groups yet"
          description="Create a group to start splitting expenses with friends, roommates, or coworkers."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create your first group
            </Button>
          }
        />
      )}

      {!isLoading && !isError && (groups?.length ?? 0) > 0 && filtered.length === 0 && (
        <EmptyState title="No matches" description={`No groups match "${query}".`} />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((group) => (
            <GroupCard key={group.id} group={group} canManage={false} />
          ))}
        </div>
      )}

      <GroupFormModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

