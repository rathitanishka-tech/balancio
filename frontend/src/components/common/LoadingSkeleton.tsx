import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

export interface LoadingSkeletonProps {
  variant?: "card" | "row" | "text" | "circle";
  count?: number;
  className?: string;
}

/**
 * Generic skeleton generator for simple lists. Feature-specific skeletons
 * with a bespoke layout (DashboardSkeleton, ExpenseSkeleton, etc.) compose
 * this rather than duplicating the shimmer styling.
 */
export function LoadingSkeleton({ variant = "row", count = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => {
        if (variant === "card") return <Skeleton key={i} className="h-32 w-full rounded-card" />;
        if (variant === "circle") return <Skeleton key={i} className="h-10 w-10 rounded-full" />;
        if (variant === "text") return <Skeleton key={i} className="h-4 w-full max-w-xs" />;
        return <Skeleton key={i} className="h-16 w-full rounded-card" />;
      })}
    </div>
  );
}
