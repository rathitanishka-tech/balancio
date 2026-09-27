import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable empty state ("No expenses yet", "No groups yet", etc.) - every
 * list view in the app should render this instead of a blank area when
 * data legitimately comes back empty (as opposed to ErrorState, which is
 * for when the request itself failed).
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line-subtle px-6 py-14 text-center",
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-ink-muted">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink-primary">{title}</p>
        {description && <p className="max-w-sm text-sm text-ink-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
