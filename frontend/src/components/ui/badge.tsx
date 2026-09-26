import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-line-subtle bg-surface-2 text-ink-secondary",
        violet: "border-accent-violet/25 bg-accent-violet/10 text-accent-violet",
        emerald: "border-accent-emerald/25 bg-accent-emerald/10 text-accent-emerald",
        rose: "border-accent-rose/25 bg-accent-rose/10 text-accent-rose",
        cyan: "border-accent-cyan/25 bg-accent-cyan/10 text-accent-cyan",
        outline: "border-line-strong text-ink-primary"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
