"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { GlassCard, GlassInput } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/common";
import { useAuth } from "@/hooks/useAuth";
import { usersApi } from "@/lib/api/users";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";

const basicProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  avatar: z.string().trim().url("Enter a valid URL").optional().or(z.literal(""))
});
type BasicProfileValues = z.infer<typeof basicProfileSchema>;

export function ProfileForm() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<BasicProfileValues>({
    resolver: zodResolver(basicProfileSchema),
    values: user ? { name: user.name, avatar: "" } : undefined
  });

  async function onSubmit(values: BasicProfileValues) {
    try {
      await usersApi.updateMe({ ...values, avatar: values.avatar || undefined });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't update your profile.";
      toast.error(message);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <GlassCard className="p-6">
        <div className="mb-6 flex items-center gap-4">
          <MemberAvatar name={user.name} avatar={watch("avatar")} size="lg" />
          <div>
            <p className="text-sm font-medium text-ink-primary">{user.name}</p>
            <p className="text-xs text-ink-muted">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <GlassInput label="Name" error={errors.name?.message} {...register("name")} />
          <GlassInput label="Avatar URL" placeholder="https://…" error={errors.avatar?.message} {...register("avatar")} />
          <GlassInput label="Email" value={user.email} disabled hint="Email can't be changed yet." />

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="text-base font-semibold text-ink-primary">Session</h3>
        <p className="mt-1 text-xs text-ink-muted">
          You are currently signed in as <span className="font-medium text-ink-primary">{user.email}</span>.
        </p>
        <div className="mt-4 flex justify-start">
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
