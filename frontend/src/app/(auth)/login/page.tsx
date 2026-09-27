"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GlassPanel, GlassInput, LiquidButton } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.email, values.password);
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't log you in.";
      toast.error(message);
    }
  }



  return (
    <GlassPanel className="p-8">
      <h1 className="text-xl font-semibold text-ink-primary">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-secondary">Log in to see what everyone owes.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <GlassInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <GlassInput
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs font-medium text-accent-violet hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1">
          Log in
        </Button>
      </form>



      <p className="mt-6 text-center text-sm text-ink-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-accent-violet hover:underline">
          Create one
        </Link>
      </p>
    </GlassPanel>
  );
}
