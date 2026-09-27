"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils/cn";

export interface GlassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * The one modal component every feature (create group, add expense, settle
 * up, confirm dialogs) should use, so the desktop-modal / mobile-bottom-sheet
 * split from the spec (section 83) is implemented once instead of in every
 * form. Picks Dialog or Sheet under the hood based on viewport width.
 */
export function GlassModal({ open, onOpenChange, title, description, children, className }: GlassModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className={cn("gap-4", className)}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
