"use client";

import { GroupHeader } from "@/components/groups/GroupHeader";
import { GroupTabs } from "@/components/groups/GroupTabs";
import { ErrorState } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroup } from "@/hooks/useGroups";

export default function GroupDetailLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { groupId: string };
}) {
  const { data: group, isLoading, isError, refetch } = useGroup(params.groupId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
    );
  }

  if (isError || !group) {
    return <ErrorState title="Couldn't load this group" onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <GroupHeader group={group} />
      <GroupTabs groupId={params.groupId} />
      {children}
    </div>
  );
}
