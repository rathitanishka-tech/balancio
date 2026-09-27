"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export function GroupTabs({ groupId }: { groupId: string }) {
  const pathname = usePathname() ?? "";

  const tabs = [
    { label: "Overview", href: `/groups/${groupId}` },
    { label: "Expenses", href: `/groups/${groupId}/expenses` },
    { label: "Balances", href: `/groups/${groupId}/balances` },
    { label: "Members", href: `/groups/${groupId}/members` },
    { label: "Analytics", href: `/groups/${groupId}/analytics` }
  ];

  return (
    <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-line-subtle px-4 sm:mx-0 sm:px-0">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "focus-ring relative shrink-0 px-3 py-2.5 text-sm font-medium text-ink-secondary transition-colors",
              active ? "text-ink-primary" : "hover:text-ink-primary"
            )}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-[2px] rounded-full bg-accent-violet" aria-hidden="true" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
