import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ctl text-sm font-medium transition-all duration-200 ease-liquid disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-accent-violet text-white shadow-soft hover:brightness-110 hover:shadow-glow",
        secondary:
          "glass-surface text-ink-primary hover:border-line-strong hover:bg-surface-2",
        ghost: "text-ink-secondary hover:bg-surface-2 hover:text-ink-primary",
        outline: "border border-line-strong bg-transparent text-ink-primary hover:bg-surface-2",
        destructive: "bg-accent-rose/90 text-white hover:bg-accent-rose",
        link: "text-accent-violet underline-offset-4 hover:underline"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[8px] px-3 text-xs",
        lg: "h-12 rounded-panel px-6 text-base",
        icon: "h-10 w-10 shrink-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Radix's Slot clones its single child and requires exactly one React
    // element - it does not tolerate extra sibling nodes, even falsy ones.
    // So in asChild mode (buttons rendered as a Link, etc.) we pass
    // `children` through untouched and skip the loading spinner, which
    // doesn't apply to that use case anyway (asChild buttons in this app
    // are navigational, not async form submits).
    if (asChild) {
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
