"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "authenticated" || status === "loading") {
    return <div className="h-screen w-full bg-bg-base" />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg-base bg-noise px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-liquid-radial" aria-hidden="true" />
      <div className="relative z-[1] w-full max-w-md">
        <Link href="/" className="focus-ring mb-8 flex justify-center rounded-ctl">
          <Logo />
        </Link>
        {children}
      </div>
    </div>
  );
}
