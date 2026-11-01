"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type SpringOptions,
} from "framer-motion";

export interface TiltProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  rotationFactor?: number;
  isRevese?: boolean;
  isReverse?: boolean;
  springOptions?: SpringOptions;
}

export function Tilt({
  children,
  className,
  style,
  rotationFactor = 15,
  isRevese = false,
  isReverse = false,
  springOptions,
}: TiltProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const reverse = isRevese || isReverse;
  const factor = reverse ? -rotationFactor : rotationFactor;

  const rotateX = useTransform(y, [-0.5, 0.5], [factor, -factor]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-factor, factor]);

  const defaultSpringOptions: SpringOptions = {
    damping: 25,
    stiffness: 140,
    mass: 0.5,
  };

  const smoothX = useSpring(rotateX, springOptions ?? defaultSpringOptions);
  const smoothY = useSpring(rotateY, springOptions ?? defaultSpringOptions);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        perspective: 1000,
        ...style,
      }}
      className={className}
    >
      <motion.div
        style={{
          transformStyle: "preserve-3d",
          rotateX: smoothX,
          rotateY: smoothY,
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

