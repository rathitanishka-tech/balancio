import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface GlassSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Pure visual chrome for the desktop sidebar - the glass background,
 * border, and header/footer slots. `components/layout/Sidebar.tsx` fills
 * this in with the actual navigation items and active-route logic.
 */
export function GlassSidebar({ header, footer, children, className, ...props }: GlassSidebarProps) {
  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-line-subtle bg-bg-elevated/80 backdrop-blur-xl",
        className
      )}
      {...props}
    >
      {header && <div className="flex h-16 shrink-0 items-center px-5">{header}</div>}
      <nav className="flex-1 overflow-y-auto px-3 py-2">{children}</nav>
      {footer && <div className="shrink-0 border-t border-line-subtle p-3">{footer}</div>}
    </aside>
  );
}
