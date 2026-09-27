"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

export interface LiquidButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

/**
 * The featured, high-emphasis CTA button (hero "Get Started", "Simplify
 * debts", "Confirm settlement") - a moving sheen and a soft accent glow on
 * hover, reserved for the single most important action on a screen so it
 * doesn't compete with itself (see components/ui/button.tsx for the
 * everyday button used everywhere else).
 */
export const LiquidButton = React.forwardRef<HTMLButtonElement, LiquidButtonProps>(
  ({ className, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "focus-ring group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-panel bg-gradient-to-br from-accent-violet to-indigo-600 px-6 text-sm font-semibold text-white shadow-glow transition-all duration-300 ease-liquid",
          "hover:shadow-[0_0_0_1px_rgba(124,108,245,0.35),0_0_36px_-4px_rgba(124,108,245,0.6)] hover:-translate-y-0.5",
          "active:translate-y-0 active:scale-[0.98]",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        <span
          className="pointer-events-none absolute inset-0 -translate-x-full bg-liquid-sheen opacity-0 transition-opacity duration-300 group-hover:translate-x-full group-hover:opacity-100"
          style={{ transitionProperty: "transform, opacity", transitionDuration: "900ms, 300ms" }}
          aria-hidden="true"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        <span className="relative z-[1] flex items-center justify-center gap-2">{children}</span>
      </button>
    );
  }
);
LiquidButton.displayName = "LiquidButton";
