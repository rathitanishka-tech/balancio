import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface GlassNavbarProps extends React.HTMLAttributes<HTMLDivElement> {
  left?: React.ReactNode;
  right?: React.ReactNode;
}

/**
 * Pure visual chrome for the top navbar. `components/layout/Navbar.tsx`
 * supplies the page title/breadcrumbs (left) and search/bell/avatar (right).
 */
export function GlassNavbar({ left, right, className, ...props }: GlassNavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 sm:h-16 shrink-0 items-center justify-between gap-1.5 sm:gap-4 border-b border-line-subtle bg-bg-base/80 px-3 sm:px-6 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">{left}</div>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">{right}</div>
    </header>
  );
}
