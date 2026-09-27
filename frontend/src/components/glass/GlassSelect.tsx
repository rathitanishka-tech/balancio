"use client";

import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export interface GlassSelectOption {
  value: string;
  label: string;
}

export interface GlassSelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: GlassSelectOption[];
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

export function GlassSelect({
  label,
  error,
  placeholder = "Select…",
  value,
  onValueChange,
  options,
  disabled,
  className,
  containerClassName
}: GlassSelectProps) {
  const id = React.useId();

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger id={id} aria-invalid={Boolean(error)} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p role="alert" className="text-xs text-accent-rose">
          {error}
        </p>
      )}
    </div>
  );
}
