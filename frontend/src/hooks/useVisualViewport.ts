"use client";

import * as React from "react";

export interface VisualViewportState {
  height: number;
  width: number;
  offsetTop: number;
  offsetLeft: number;
  isKeyboardOpen: boolean;
}

/**
 * SSR-safe hook to track window.visualViewport resize and scroll events.
 * Essential for mobile virtual keyboard awareness and repositioning
 * search / dialog overlays above the software keyboard.
 */
export function useVisualViewport(): VisualViewportState | null {
  const [viewport, setViewport] = React.useState<VisualViewportState | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    const vv = window.visualViewport;

    const update = () => {
      // If visual viewport is significantly smaller than window.innerHeight, keyboard is active
      const keyboardThreshold = 140; // minimum keyboard height in px
      const isKeyboardOpen = window.innerHeight - vv.height > keyboardThreshold;

      setViewport({
        height: Math.round(vv.height),
        width: Math.round(vv.width),
        offsetTop: Math.round(vv.offsetTop),
        offsetLeft: Math.round(vv.offsetLeft),
        isKeyboardOpen,
      });
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return viewport;
}
