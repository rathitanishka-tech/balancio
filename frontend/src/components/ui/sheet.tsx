"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-fade-in", className)}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * `side="bottom"` (the default, and the only variant this app uses) renders
 * a full-width sheet pinned to the bottom of the viewport - the "bottom-sheet
 * modal" the spec calls for on mobile, and doubles as a large centered panel
 * on wider screens via the `sm:` overrides.
 */
const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col gap-4 rounded-t-modal border-t border-[#DCE3ED] dark:border-[#26354B] bg-[#FFFFFF] dark:bg-[#080D18] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[#172033] dark:text-[#E8EDF6] shadow-2xl overflow-y-auto",
        "data-[state=open]:animate-slide-up",
        // Desktop: centered modal
        "sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:w-full sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-modal sm:border sm:border-[#DCE3ED] dark:sm:border-[#26354B] sm:data-[state=open]:animate-modal-scale-in",
        "max-w-lg",
        className
      )}
      {...props}
    >
      <div className="mx-auto -mt-1 mb-1 h-1 w-10 shrink-0 rounded-full bg-[#DCE3ED] dark:bg-[#26354B] sm:hidden" aria-hidden="true" />
      {children}
      <DialogPrimitive.Close className="focus-ring absolute right-4 top-4 rounded-full p-1.5 text-[#8995A7] dark:text-[#8795A9] transition-colors hover:bg-[#EAEFF6] dark:hover:bg-[#152136] hover:text-[#172033] dark:hover:text-[#E8EDF6]">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1.5 text-left", className)} {...props} />
);

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold text-ink-primary", className)} {...props} />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-ink-secondary", className)} {...props} />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription };
