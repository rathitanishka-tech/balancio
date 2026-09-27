import * as React from "react";
import { MemberAvatar } from "@/components/common/MemberAvatar";
import { cn } from "@/lib/utils/cn";

export interface MemberListProps {
  members: { userId: string; name: string; avatar?: string }[];
  max?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

/** A compact overlapping-avatar stack, e.g. "Tanu, Rahul, Priya +2" on a group card. */
export function MemberList({ members, max = 4, size = "sm", className }: MemberListProps) {
  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {visible.map((m) => (
          <MemberAvatar
            key={m.userId}
            name={m.name}
            avatar={m.avatar}
            size={size}
            className="ring-2 ring-bg-elevated"
          />
        ))}
      </div>
      {overflow > 0 && (
        <span className="ml-2 text-xs text-ink-muted">
          +{overflow} more
        </span>
      )}
    </div>
  );
}
