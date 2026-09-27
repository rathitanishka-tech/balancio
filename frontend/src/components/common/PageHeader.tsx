import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">{title}</h1>
        {description && <p className="text-sm text-ink-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
