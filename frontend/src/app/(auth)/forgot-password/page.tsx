"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { GlassPanel, GlassInput } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit() {
    // Honest disabled state: the current splitwise-backend doesn't expose a
    // password-reset endpoint yet (see API.md), so this deliberately does
    // not pretend to send an email. Wiring this up later only means adding
    // a `forgotPassword` call to lib/api/auth.ts.
    await new Promise((r) => setTimeout(r, 400));
    toast.info("Password reset isn't available yet. Please contact your workspace admin.");
  }

  return (
    <GlassPanel className="p-8">
      <Link href="/login" className="mb-4 flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink-secondary">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to login
      </Link>
      <h1 className="text-xl font-semibold text-ink-primary">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-secondary">Enter the email associated with your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <GlassInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" size="lg" loading={isSubmitting}>
          Send reset instructions
        </Button>
      </form>
    </GlassPanel>
  );
}
