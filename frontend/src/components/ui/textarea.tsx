import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "focus-ring flex min-h-[88px] w-full rounded-ctl border border-line-subtle bg-surface-1/80 px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted transition-colors duration-150",
        "hover:border-line-strong",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
