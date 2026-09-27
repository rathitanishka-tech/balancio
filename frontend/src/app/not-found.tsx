import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-bg-base bg-noise px-6 text-center">
      <Logo />
      <div className="space-y-2">
        <p className="text-6xl font-semibold tracking-tight text-ink-primary">404</p>
        <p className="text-base text-ink-secondary">This page doesn&apos;t exist.</p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
