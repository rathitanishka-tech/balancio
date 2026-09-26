"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Plus, Activity, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function MobileBottomNav({ onAddExpense }: { onAddExpense: () => void }) {
  const pathname = usePathname() ?? "";

  const items = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Groups", href: "/groups", icon: Users }
  ];
  const trailingItems = [
    { label: "Activity", href: "/notifications", icon: Activity },
    { label: "Profile", href: "/profile", icon: UserIcon }
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      className="glass-surface-strong fixed inset-x-3 bottom-3 z-40 flex items-center justify-between rounded-panel px-2 py-2 lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="Primary"
    >
      {items.map((item) => (
        <NavLink key={item.href} {...item} active={isActive(item.href)} />
      ))}

      <button
        onClick={onAddExpense}
        aria-label="Add expense"
        className="focus-ring -mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-violet to-indigo-600 text-white shadow-glow transition-transform active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>

      {trailingItems.map((item) => (
        <NavLink key={item.href} {...item} active={isActive(item.href)} />
      ))}
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex flex-col items-center gap-0.5 rounded-ctl px-3 py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-accent-violet" : "text-ink-muted hover:text-ink-secondary"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}
