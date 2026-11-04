"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils/cn";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center gap-1 rounded-ctl border border-[#DCE3ED] dark:border-[#26354B] bg-[#F4F6FA] dark:bg-[#111B2B] p-1",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "focus-ring inline-flex items-center justify-center whitespace-nowrap rounded-[8px] px-3 py-1.5 text-sm font-medium text-[#556477] dark:text-[#AAB6C8] transition-all duration-200",
      "data-[state=active]:bg-[#FFFFFF] dark:data-[state=active]:bg-[#080D18] data-[state=active]:text-[#172033] dark:data-[state=active]:text-[#E8EDF6] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#DCE3ED] dark:data-[state=active]:border-[#26354B]",
      "hover:text-[#172033] dark:hover:text-[#E8EDF6]",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("focus-ring mt-4 animate-fade-in", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
