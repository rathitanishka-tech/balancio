"use client";

import { CheckCheck, Bell } from "lucide-react";
import { PageHeader, EmptyState, ErrorState, LoadingSkeleton } from "@/components/common";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useNotifications, useMarkAllNotificationsRead } from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const { data, isLoading, isError, refetch } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description={data && data.unread > 0 ? `${data.unread} unread` : "You're all caught up"}
        action={
          data && data.unread > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {isLoading && <LoadingSkeleton count={5} />}
      {isError && <ErrorState title="Couldn't load notifications" onRetry={() => refetch()} />}

      {!isLoading && !isError && data?.items.length === 0 && (
        <EmptyState icon={<Bell className="h-5 w-5" />} title="No notifications yet" description="We'll let you know when something needs your attention." />
      )}

      {!isLoading && !isError && data && data.items.length > 0 && (
        <GlassCard className="p-3">
          <div className="flex flex-col divide-y divide-line-subtle">
            {data.items.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

