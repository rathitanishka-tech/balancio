"use client";

import { useEffect } from "react";
import { Logo } from "@/components/layout/Logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-[#050505] px-6 text-center text-[#f5f5f5]">
        <Logo />
        <div className="space-y-2">
          <p className="text-xl font-semibold">Something went wrong</p>
          <p className="max-w-sm text-sm text-[#9a9fa8]">
            An unexpected error occurred. You can try again, or head back to the dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={reset}>
            Try again
          </Button>
          <Button asChild>
            <a href="/dashboard">Back to dashboard</a>
          </Button>
        </div>
      </body>
    </html>
  );
}
