import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds the subtle radial liquid-glow background used behind hero/page-level sections. */
  glow?: boolean;
}

/**
 * A larger structural surface for page sections (as opposed to GlassCard,
 * which is for individual content cards). Slightly stronger blur/border
 * than GlassCard so nested GlassCards still read as distinct layers.
 */
export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, glow = false, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "glass-surface-strong relative overflow-hidden rounded-panel",
        glow && "bg-liquid-radial",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
GlassPanel.displayName = "GlassPanel";
