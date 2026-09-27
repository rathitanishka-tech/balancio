import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";

export interface MemberAvatarProps {
  name: string;
  avatar?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<MemberAvatarProps["size"]>, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base"
};

function initials(name: string | undefined): string {
  const safeName = name || "?";
  const parts = safeName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MemberAvatar({ name, avatar, size = "md", className }: MemberAvatarProps) {
  return (
    <Avatar className={cn(SIZE_CLASSES[size], className)}>
      {avatar && <AvatarImage src={avatar} alt={name} />}
      <AvatarFallback aria-hidden="true">{initials(name)}</AvatarFallback>
      <span className="sr-only">{name}</span>
    </Avatar>
  );
}
