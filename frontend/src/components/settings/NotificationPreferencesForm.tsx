"use client";

import * as React from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api/users";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";
import type { NotificationPreferences } from "@/types/user";

const ROWS: { key: keyof NotificationPreferences; label: string; description: string }[] = [
  { key: "expenseCreated", label: "Expense updates", description: "When an expense is added, edited, or removed" },
  { key: "settlementCreated", label: "Settlement updates", description: "When a payment is recorded" },
  { key: "email", label: "Group invitations", description: "When you're invited to a new group" }
];

export function NotificationPreferencesForm() {
  const { user, refreshUser } = useAuth();
  const [pending, setPending] = React.useState<string | null>(null);

  const prefs: NotificationPreferences = user?.notificationPreferences ?? {
    email: true,
    push: true,
    expenseCreated: true,
    settlementCreated: true
  };

  async function toggle(key: keyof NotificationPreferences) {
    setPending(key);
    try {
      await usersApi.updateMe({ notificationPreferences: { ...prefs, [key]: !prefs[key] } });
      await refreshUser();
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't update this preference.";
      toast.error(message);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col divide-y divide-line-subtle">
      {ROWS.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
          <div>
            <Label htmlFor={`pref-${row.key}`} className="text-ink-primary">
              {row.label}
            </Label>
            <p className="text-xs text-ink-muted">{row.description}</p>
          </div>
          <Switch
            id={`pref-${row.key}`}
            checked={Boolean(prefs[row.key])}
            disabled={pending === row.key}
            onCheckedChange={() => toggle(row.key)}
          />
        </div>
      ))}
    </div>
  );
}
