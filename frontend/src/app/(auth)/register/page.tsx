"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { GlassPanel, GlassInput } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterFormValues) {
    try {
      await registerUser(values.name, values.email, values.password);
      toast.success("Account created");
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't create your account.";
      toast.error(message);
    }
  }

  return (
    <GlassPanel className="p-8">
      <h1 className="text-xl font-semibold text-ink-primary">Create your account</h1>
      <p className="mt-1 text-sm text-ink-secondary">Start splitting expenses in a couple of minutes.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <GlassInput label="Name" autoComplete="name" placeholder="Tanu" error={errors.name?.message} {...register("name")} />
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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <GlassInput
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <Button type="submit" size="lg" loading={isSubmitting} className="mt-1">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent-violet hover:underline">
          Log in
        </Link>
      </p>
    </GlassPanel>
  );
}
