import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "focus-ring flex h-10 w-full rounded-ctl border border-line-subtle bg-surface-1/80 px-3.5 py-2 text-sm text-ink-primary placeholder:text-ink-muted transition-colors duration-150",
        "hover:border-line-strong",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-accent-rose/60",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
