"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils/cn";

/** The navbar bell - badge count comes from the real unread count, never hardcoded. */
export function NotificationBell() {
  const router = useRouter();
  const { data } = useNotifications();
  const unread = data?.unread ?? 0;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={() => router.push("/notifications")}
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
    >
      <Bell className="h-[18px] w-[18px]" />
      {unread > 0 && (
        <span
          className={cn(
            "absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent-rose px-1 text-[10px] font-semibold text-white"
          )}
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Button>
  );
}
