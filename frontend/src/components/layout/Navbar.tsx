"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { GlassNavbar } from "@/components/glass";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserMenu } from "@/components/layout/UserMenu";
import { Button } from "@/components/ui/button";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/groups": "Groups",
  "/expenses": "Expenses",
  "/settlements": "Settlements",
  "/analytics": "Analytics",
  "/notifications": "Notifications",
  "/settings": "Settings",
  "/profile": "Profile",
  "/search": "Search"
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "groups" && segments.length > 1) {
    const sub = segments[2];
    if (sub) return sub[0].toUpperCase() + sub.slice(1);
    return "Group";
  }
  if (segments[0] === "expenses" && segments.length > 1) return "Expense details";
  const last = segments[segments.length - 1] ?? "Dashboard";
  return last.charAt(0).toUpperCase() + last.slice(1);
}

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const pathname = usePathname() ?? "/dashboard";

  return (
    <GlassNavbar
      left={
        <div className="flex items-center gap-2.5">
          <h2 className="truncate text-base font-semibold text-ink-primary sm:text-lg">{titleFor(pathname)}</h2>
        </div>
      }
      right={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenSearch}
            className="hidden items-center gap-2 text-ink-secondary sm:flex"
          >
            <Search className="h-4 w-4" />
            Search
            <kbd className="ml-1 rounded-[6px] border border-line-strong bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-ink-muted">
              ⌘K
            </kbd>
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden" onClick={onOpenSearch} aria-label="Search">
            <Search className="h-[18px] w-[18px]" />
          </Button>
          <ThemeToggle />
          <NotificationBell />
          <div className="hidden sm:block">
            <UserMenu collapsed />
          </div>
        </>
      }
    />
  );
}
