"use client";

import { Toaster as Sonner } from "sonner";

/**
 * Every toast the spec asks for ("Expense added", "Settlement recorded", etc.)
 * is fired via `import { toast } from "sonner"` directly at the call site
 * (in the mutation's onSuccess/onError) - this component just mounts the
 * themed toast viewport once, in the root layout.
 */
export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "glass-surface-strong !rounded-card !border-line-strong !text-ink-primary !shadow-lift",
          title: "!text-ink-primary !font-medium",
          description: "!text-ink-secondary",
          actionButton: "!bg-accent-violet !text-white",
          cancelButton: "!bg-surface-2 !text-ink-secondary",
          success: "!border-accent-emerald/30",
          error: "!border-accent-rose/30"
        }
      }}
    />
  );
}
