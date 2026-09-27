"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GlassInput } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { usersApi } from "@/lib/api/users";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/validations/profile";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";

export function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: ChangePasswordFormValues) {
    try {
      await usersApi.changePassword(values.currentPassword, values.newPassword);
      toast.success("Password updated");
      reset();
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't update your password.";
      toast.error(message);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <GlassInput
        label="Current password"
        type="password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <GlassInput label="New password" type="password" error={errors.newPassword?.message} {...register("newPassword")} />
      <GlassInput
        label="Confirm new password"
        type="password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting}>
          Update password
        </Button>
      </div>
    </form>
  );
}
