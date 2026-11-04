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
        {label && (
          <Label htmlFor={inputId} className="text-[#556477] dark:text-[#AAB6C8] text-sm font-medium">
            {label}
          </Label>
        )}
        <Input
          id={inputId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={cn(
            "border-[#DCE3ED] dark:border-[#26354B] bg-[#F4F6FA] dark:bg-[#111B2B] text-[#172033] dark:text-[#E8EDF6] placeholder:text-[#8995A7] dark:placeholder:text-[#8795A9] hover:bg-[#EAEFF6] dark:hover:bg-[#152136] hover:border-[#B0BFD3] dark:hover:border-[#374864] focus:border-[#4D8DFF] dark:focus:border-[#4D8DFF] focus:ring-2 focus:ring-[#4D8DFF]/25 focus:outline-none",
            className
          )}
          {...props}
        />
        {error ? (
          <p id={errorId} role="alert" className="text-xs text-accent-rose">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-[#8995A7] dark:text-[#8795A9]">{hint}</p>
        ) : null}
      </div>
    );
  }
);
GlassInput.displayName = "GlassInput";
