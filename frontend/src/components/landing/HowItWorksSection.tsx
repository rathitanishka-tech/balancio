"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Users2, ReceiptText, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { fadeInUpVariants, staggerContainerVariants } from "./motionVariants";

const STEPS = [
  {
    step: "01",
    title: "Create or join a group",
    description: "Organize expenses around trips, flatmates, dinners, or shared projects with the people that matter.",
    icon: Users2,
    badge: "Step 1",
  },
  {
    step: "02",
    title: "Add shared expenses",
    description: "Log receipts in seconds. Select who paid and divide costs equally, by percentages, or exact shares.",
    icon: ReceiptText,
    badge: "Step 2",
  },
  {
    step: "03",
    title: "Understand and settle balances",
    description: "Review mathematically simplified balances and settle up in a tap with zero lingering debt confusion.",
    icon: CheckCircle2,
    badge: "Step 3",
  },
];

export function HowItWorksSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="how-it-works" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 sm:py-28">
      {/* Background radial gradient accent */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[600px] rounded-full bg-accent-blue/10 blur-[130px] -z-10"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent-blue">
          SIMPLE WORKFLOW
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-ink-primary">
          From shared spending to settled in three steps.
        </h2>
        <p className="mt-4 text-base text-ink-secondary sm:text-lg">
          Start in less than sixty seconds. No banking logins or complicated setups required.
        </p>
      </div>

      {/* Timeline Steps */}
      <div className="relative mt-16 sm:mt-20">
        {/* Desktop Connecting Horizontal Line */}
        <div
          className="hidden md:block absolute top-[52px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-accent-blue/20 via-accent-cyan/30 to-accent-blue/20 -z-10"
          aria-hidden="true"
        />

        <motion.div
          variants={shouldReduceMotion ? undefined : staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                variants={shouldReduceMotion ? undefined : fadeInUpVariants}
                className="relative flex flex-col items-center text-center md:items-start md:text-left"
              >
                {/* Step Icon Badge */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-line-strong bg-surface-2 shadow-soft text-accent-blue mb-6">
                  <Icon className="h-6 w-6" />
                </div>

                <div className="inline-block rounded-pill border border-line-subtle bg-surface-1 px-3 py-1 text-xs font-bold text-accent-blue mb-3">
                  {item.step} &bull; {item.badge}
                </div>

                <h3 className="text-xl font-bold tracking-tight text-ink-primary">
                  {item.title}
                </h3>

                <p className="mt-2.5 text-sm sm:text-base text-ink-secondary leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

