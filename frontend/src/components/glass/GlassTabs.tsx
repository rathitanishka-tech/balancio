"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils/cn";

export interface GlassTabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface GlassTabsProps {
  items: GlassTabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  listClassName?: string;
}

/**
 * Declarative tabs used for the split-type selector (Equal/Percentage/
 * Custom) and the group detail tabs (Overview/Expenses/Balances/Members/
 * Analytics) - callers pass `items` instead of hand-assembling
 * TabsList/TabsTrigger/TabsContent every time.
 */
export function GlassTabs({ items, value, defaultValue, onValueChange, listClassName }: GlassTabsProps) {
  return (
    <Tabs value={value} defaultValue={defaultValue ?? items[0]?.value} onValueChange={onValueChange}>
      <TabsList className={cn("w-full sm:w-auto", listClassName)}>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} className="flex-1 sm:flex-none">
            <span className="flex items-center gap-1.5">
              {item.icon}
              {item.label}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent key={item.value} value={item.value}>
          {item.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
