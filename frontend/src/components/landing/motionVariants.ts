import { type Variants, type Transition } from "framer-motion";

/**
 * Shared motion easing curve and duration scale for the Midnight Finance
 * cinematic motion language.
 */
export const TRANSITION_SMOOTH: Transition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1],
};

export const TRANSITION_SLOW: Transition = {
  duration: 0.8,
  ease: [0.22, 1, 0.36, 1],
};

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: TRANSITION_SMOOTH,
  },
};

export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: TRANSITION_SMOOTH,
  },
};

export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const staggerFastVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.02,
    },
  },
};

export const cardHoverVariants: Variants = {
  initial: { y: 0, scale: 1 },
  hover: {
    y: -4,
    scale: 1.01,
    transition: { duration: 0.25, ease: "easeOut" },
  },
};

/**
 * Floating animation variant for hero preview composition cards.
 * Provides subtle, non-distracting ambient vertical drift with distinct delays.
 */
export function makeFloatingVariant(distance: number = 6, duration: number = 6, delay: number = 0): Variants {
  return {
    initial: { y: 0 },
    animate: {
      y: [-distance, distance, -distance],
      transition: {
        duration,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
        delay,
      },
    },
  };
}
