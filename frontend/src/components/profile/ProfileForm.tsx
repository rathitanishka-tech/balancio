"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  const { user, refreshUser } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<BasicProfileValues>({
    resolver: zodResolver(basicProfileSchema),
    values: user ? { name: user.name, avatar: user.avatar ?? "" } : undefined
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

  if (!user) return null;

  return (
    <GlassCard className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <MemberAvatar name={user.name} avatar={watch("avatar") || user.avatar} size="lg" />
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
  );
}
