"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Receipt, Users, PieChart, ShieldCheck } from "lucide-react";
import { staggerFastVariants, fadeInUpVariants } from "./motionVariants";

const VALUE_ITEMS = [
  { label: "Know who paid.", icon: Receipt },
  { label: "Split expenses fairly.", icon: Users },
  { label: "See the bigger picture.", icon: PieChart },
  { label: "Settle up with confidence.", icon: ShieldCheck },
];

export function ValueStrip() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        variants={shouldReduceMotion ? undefined : staggerFastVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="rounded-card border border-line-subtle bg-surface-1/60 p-4 sm:p-5 backdrop-blur-xl shadow-soft"
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-6">
          {VALUE_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                variants={shouldReduceMotion ? undefined : fadeInUpVariants}
                className="flex items-center justify-center gap-2.5 text-center sm:text-left"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue/10 text-accent-blue">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-ink-primary tracking-tight">
                  {item.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

