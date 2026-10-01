"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkNotificationRead, useDeleteNotification } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/formatters/date";
import { cn } from "@/lib/utils/cn";
import type { Notification } from "@/types/notification";

export function NotificationItem({ notification }: { notification: Notification }) {
  const markRead = useMarkNotificationRead();
  const remove = useDeleteNotification();

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-ctl px-3 py-3 transition-colors",
        !notification.read && "bg-accent-violet/[0.04]"
      )}
      onClick={() => !notification.read && markRead.mutate(notification.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !notification.read) markRead.mutate(notification.id);
      }}
    >
      <span
        className={cn(
          "mt-1.5 h-2 w-2 shrink-0 rounded-full",
          notification.read ? "bg-transparent" : "bg-accent-violet"
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink-primary">{notification.title}</p>
        <p className="text-sm text-ink-secondary">{notification.message}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{timeAgo(notification.createdAt)}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          remove.mutate(notification.id);
        }}
        aria-label="Delete notification"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

