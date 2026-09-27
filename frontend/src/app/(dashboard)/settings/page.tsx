"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, Info } from "lucide-react";
import { PageHeader } from "@/components/common";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { PreferencesForm } from "@/components/settings/PreferencesForm";
import { NotificationPreferencesForm } from "@/components/settings/NotificationPreferencesForm";
import { useAuth } from "@/hooks/useAuth";

function SettingsSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <GlassCard className="p-6">
      <h2 className="text-base font-semibold text-ink-primary">{title}</h2>
      {description && <p className="mt-1 text-sm text-ink-secondary">{description}</p>}
      <div className="mt-5">{children}</div>
    </GlassCard>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title="Settings" description="Manage your account, preferences, and security." />

      <SettingsSection title="Account" description="Your name and email are managed from your Profile page.">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-secondary">Signed in as</span>
          <span className="font-medium text-ink-primary">{user?.email}</span>
        </div>
            <Separator className="my-5" />
            <ChangePasswordForm />
      </SettingsSection>

      <SettingsSection title="Preferences" description="Your default currency and timezone.">
        <PreferencesForm />
      </SettingsSection>

      <SettingsSection title="Notifications" description="Choose what you want to be notified about.">
        <NotificationPreferencesForm />
      </SettingsSection>

      <SettingsSection title="Security">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-primary">Log out</p>
              <p className="text-xs text-ink-muted">End your current session on this device.</p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between opacity-60">
            <div>
              <p className="text-sm font-medium text-ink-primary">Log out everywhere</p>
              <p className="text-xs text-ink-muted">Not yet supported by the backend&apos;s stateless JWT sessions.</p>
            </div>
            <Button variant="secondary" disabled>
              Log out all sessions
            </Button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
