import * as React from "react";
import { cn } from "@/lib/utils/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[88px] w-full rounded-ctl border border-[#DCE3ED] dark:border-[#26354B] bg-[#F4F6FA] dark:bg-[#111B2B] px-3.5 py-2.5 text-sm text-[#172033] dark:text-[#E8EDF6] placeholder:text-[#8995A7] dark:placeholder:text-[#8795A9] transition-colors duration-150",
        "hover:bg-[#EAEFF6] dark:hover:bg-[#152136] hover:border-[#B0BFD3] dark:hover:border-[#374864]",
        "focus:outline-none focus:border-[#4D8DFF] dark:focus:border-[#4D8DFF] focus:ring-2 focus:ring-[#4D8DFF]/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-accent-rose/60 aria-[invalid=true]:focus:ring-accent-rose/25",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
