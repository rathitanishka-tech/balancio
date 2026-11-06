"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Search, LogOut, Bot } from "lucide-react";
import { GlassNavbar } from "@/components/glass";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserMenu } from "@/components/layout/UserMenu";

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

export function Navbar({ onOpenSearch, onOpenAi }: { onOpenSearch: () => void; onOpenAi?: () => void }) {
  const pathname = usePathname() ?? "/dashboard";
  const { logout, user } = useAuth();

  return (
    <GlassNavbar
      left={
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="truncate text-sm sm:text-lg font-semibold text-ink-primary max-w-[100px] xs:max-w-none">{titleFor(pathname)}</h2>
        </div>
      }
      right={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onOpenAi}
            className="hidden items-center gap-2 text-accent-violet sm:flex mr-2"
          >
            <Bot className="h-4 w-4" />
            Ask AI
          </Button>
          <Button variant="ghost" size="icon" className="sm:hidden text-accent-violet h-9 w-9 min-h-[36px] min-w-[36px]" onClick={onOpenAi} aria-label="Ask AI">
            <Bot className="h-[18px] w-[18px]" />
          </Button>

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
          <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9 min-h-[36px] min-w-[36px]" onClick={onOpenSearch} aria-label="Search">
            <Search className="h-[18px] w-[18px]" />
          </Button>
          <ThemeToggle />
          <NotificationBell />
          <div className="flex items-center gap-1 sm:gap-2">
            {user && <span className="hidden md:inline text-sm font-medium text-ink-primary">{user.name}</span>}
            <UserMenu collapsed align="end" />
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              className="text-ink-secondary hover:text-ink-primary hover:bg-surface-2 h-9 w-9 min-h-[36px] min-w-[36px]"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </>
      }
    />
  );
}
