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
      {label && (
        <Label htmlFor={id} className="text-[#556477] dark:text-[#AAB6C8] text-sm font-medium">
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            "border-[#DCE3ED] dark:border-[#26354B] bg-[#F4F6FA] dark:bg-[#111B2B] text-[#172033] dark:text-[#E8EDF6] hover:bg-[#EAEFF6] dark:hover:bg-[#152136] hover:border-[#B0BFD3] dark:hover:border-[#374864] focus:border-[#4D8DFF] dark:focus:border-[#4D8DFF] focus:ring-2 focus:ring-[#4D8DFF]/25 focus:outline-none",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="border-[#DCE3ED] dark:border-[#26354B] bg-[#FFFFFF] dark:bg-[#080D18] text-[#172033] dark:text-[#E8EDF6] shadow-xl">
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-[#172033] dark:text-[#E8EDF6] hover:bg-[#EAEFF6] dark:hover:bg-[#152136] focus:bg-[#EAEFF6] dark:focus:bg-[#152136] focus:text-[#172033] dark:focus:text-[#E8EDF6]"
            >
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
