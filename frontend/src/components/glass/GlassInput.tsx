import * as React from "react";
import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export interface GlassInputProps extends InputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerClassName?: string;
}

/**
 * The standard labeled form field used throughout every form in the app
 * (login, register, create group, expense form, profile, settings) - a
 * label, the glass-styled input, and an error/hint line, wired for
 * react-hook-form's `register()` spread.
 */
export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, hint, id, containerClassName, className, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <Input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={className}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-accent-rose">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-ink-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
GlassInput.displayName = "GlassInput";
