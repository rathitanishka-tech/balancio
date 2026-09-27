"use client";

import * as React from "react";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

export interface CountUpProps {
  value: number;
  durationMs?: number;
  formatValue?: (value: number) => string;
}

/** Animates from the previous value to the new one whenever `value` changes. Skips the animation entirely under prefers-reduced-motion. */
export function CountUp({ value, durationMs = 600, formatValue }: CountUpProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [display, setDisplay] = React.useState(value);
  const fromRef = React.useRef(value);

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    let raf: number;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs, prefersReducedMotion]);

  return <>{formatValue ? formatValue(display) : display.toLocaleString()}</>;
}
