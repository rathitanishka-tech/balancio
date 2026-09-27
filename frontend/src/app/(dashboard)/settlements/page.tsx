"use client";

import { GlassCard } from "@/components/glass";
import { PageHeader, EmptyState, ErrorState, LoadingSkeleton } from "@/components/common";
import { SettlementRow } from "@/components/settlements/SettlementRow";
import { useSettlements } from "@/hooks/useSettlements";
import { useGroups, useGroupMembers } from "@/hooks/useGroups";
import { formatDate } from "@/lib/formatters/date";
import { HandCoins } from "lucide-react";

function GroupedSettlements() {
  const { data, isLoading, isError, refetch } = useSettlements();
  const { data: groups } = useGroups();
  const groupNameById = new Map((groups ?? []).map((g) => [g._id, g.name]));

  if (isLoading) return <LoadingSkeleton count={5} />;
  if (isError) return <ErrorState title="Couldn't load settlements" onRetry={() => refetch()} />;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={<HandCoins className="h-5 w-5" />}
        title="No settlements yet"
        description="Once you record a payment to settle up, it'll show up here."
      />
    );
  }

  const byDate = new Map<string, typeof data.items>();
  for (const s of data.items) {
    const key = formatDate(s.date);
    byDate.set(key, [...(byDate.get(key) ?? []), s]);
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(byDate.entries()).map(([date, settlements]) => (
        <div key={date}>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-muted">{date}</p>
          <GlassCard className="p-5">
            <div className="divide-y divide-line-subtle">
              {settlements.map((s) => (
                <SettlementRowWithNames key={s._id} settlement={s} groupName={groupNameById.get(s.groupId)} />
              ))}
            </div>
          </GlassCard>
        </div>
      ))}
    </div>
  );
}

function SettlementRowWithNames({
  settlement,
  groupName
}: {
  settlement: import("@/types/settlement").Settlement;
  groupName?: string;
}) {
  const { data: members } = useGroupMembers(settlement.groupId);
  const nameByUserId = new Map((members ?? []).map((m) => [m.userId, m.name]));

  return (
    <SettlementRow
      settlement={settlement}
      fromName={nameByUserId.get(settlement.fromUser) ?? "Member"}
      toName={nameByUserId.get(settlement.toUser) ?? "Member"}
      groupName={groupName}
    />
  );
}

export default function SettlementsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settlements" description="Every payment recorded to settle a balance." />
      <GroupedSettlements />
    </div>
  );
}
