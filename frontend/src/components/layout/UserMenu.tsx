"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User as UserIcon } from "lucide-react";
import { GlassDropdown } from "@/components/glass";
import { MemberAvatar } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export function UserMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <GlassDropdown
      align="start"
      trigger={
        <button className="focus-ring flex w-full items-center gap-2.5 rounded-ctl p-2 text-left transition-colors hover:bg-surface-2">
          <MemberAvatar name={user.name} avatar={user.avatar} size="sm" />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink-primary">{user.name}</span>
              <span className="block truncate text-xs text-ink-muted">{user.email}</span>
            </span>
          )}
        </button>
      }
      items={[
        { label: "Profile", icon: <UserIcon className="h-4 w-4" />, onSelect: () => router.push("/profile") },
        { label: "Settings", icon: <Settings className="h-4 w-4" />, onSelect: () => router.push("/settings") },
        { label: "Log out", icon: <LogOut className="h-4 w-4" />, onSelect: handleLogout, destructive: true, separatorBefore: true }
      ]}
    />
  );
}


