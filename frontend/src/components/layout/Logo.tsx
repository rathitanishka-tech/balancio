import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export interface LogoProps {
  className?: string;
  markOnly?: boolean;
}

export function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/balancio.png"
        alt="Balancio Logo"
        width={48}
        height={48}
        className="object-contain"
        priority
      />
      {!markOnly && <span className="text-lg font-semibold tracking-tight text-ink-primary">Balancio</span>}
    </div>
  );
}
