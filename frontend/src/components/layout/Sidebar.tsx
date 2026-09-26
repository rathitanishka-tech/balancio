"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  HandCoins,
  BarChart3,
  Bell,
  Settings as SettingsIcon
} from "lucide-react";
import { GlassSidebar } from "@/components/glass";
import { Logo } from "@/components/layout/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { NAV_SECTIONS, type NavItem } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";

const ICONS: Record<NavItem["icon"], React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  groups: Users,
  expenses: Receipt,
  settlements: HandCoins,
  analytics: BarChart3,
  notifications: Bell,
  settings: SettingsIcon
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <GlassSidebar
      header={
        <Link href="/dashboard" className="focus-ring rounded-ctl">
          <Logo />
        </Link>
      }
      footer={<UserMenu />}
      className="hidden lg:flex"
    >
      <div className="flex flex-col gap-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
              {section.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "focus-ring group relative flex items-center gap-2.5 rounded-ctl px-3 py-2 text-sm font-medium text-ink-secondary transition-all duration-200",
                      "hover:bg-surface-2 hover:text-ink-primary",
                      active && "bg-surface-2 text-ink-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                    )}
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-accent-violet shadow-[0_0_10px_1px_rgba(124,108,245,0.6)]"
                        aria-hidden="true"
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </GlassSidebar>
  );
}
