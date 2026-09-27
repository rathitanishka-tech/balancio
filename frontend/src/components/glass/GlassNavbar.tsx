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
        "sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line-subtle bg-bg-base/70 px-4 backdrop-blur-xl sm:px-6",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-3">{left}</div>
      <div className="flex shrink-0 items-center gap-2">{right}</div>
    </header>
  );
}
