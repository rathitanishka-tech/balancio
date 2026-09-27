"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

export interface GlassDropdownItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Renders a separator above this item. */
  separatorBefore?: boolean;
}

export interface GlassDropdownProps {
  trigger: React.ReactNode;
  items: GlassDropdownItem[];
  align?: "start" | "center" | "end";
  contentClassName?: string;
}

/**
 * The action-menu pattern used for group cards ("edit / delete"), expense
 * rows, member rows, and the user menu - a trigger plus a declarative list
 * of items, instead of hand-rolling DropdownMenuContent/Item every time.
 */
export function GlassDropdown({ trigger, items, align = "end", contentClassName }: GlassDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn("w-48", contentClassName)}>
        {items.map((item, idx) => (
          <React.Fragment key={item.label}>
            {item.separatorBefore && idx > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              destructive={item.destructive}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className="cursor-pointer"
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
