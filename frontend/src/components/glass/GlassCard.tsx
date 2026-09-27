"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds a moving highlight sheen on hover - use sparingly (spec: avoid overusing glassmorphism). */
  interactive?: boolean;
}

/**
 * The base "glass" surface used throughout the app: a translucent,
 * blurred panel with a thin border and a soft inset highlight. This is
 * the building block most feature cards (BalanceCard, GroupCard,
 * ExpenseCard, StatCard) are built on top of.
 */
export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, interactive = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative overflow-hidden rounded-card border border-line-subtle bg-surface-1/70 shadow-soft backdrop-blur-xl transition-all duration-300 ease-liquid",
          interactive && "hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
          className
        )}
        {...props}
      >
        {interactive && <span className="liquid-sheen" aria-hidden="true" />}
        <div className="relative z-[1]">{children}</div>
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";
