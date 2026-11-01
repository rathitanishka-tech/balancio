"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Split, Users, BarChart3, Bot, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/glass";
import { fadeInUpVariants, staggerContainerVariants } from "./motionVariants";

const FEATURES = [
  {
    icon: Split,
    title: "Effortless Expense Splitting",
    description:
      "Record costs in seconds. Split equally, by percentages, or exact shares so everyone pays their fair part without manual math or napkin calculations.",
    tag: "Flexible Math",
    accentColor: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
  },
  {
    icon: Users,
    title: "Group Balance Tracking",
    description:
      "Always know who owes whom in real-time. Group balances are continuously reconciled on the server so no shared expense slips through the cracks.",
    tag: "Real-time Ledger",
    accentColor: "text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20",
  },
  {
    icon: BarChart3,
    title: "Spending Insights",
    description:
      "Visualize your shared costs with category breakdowns and timeline analytics. Understand group trends and keep travel or roommate budgets on track.",
    tag: "Visual Analytics",
    accentColor: "text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20",
  },
  {
    icon: Bot,
    title: "AI-Powered Assistance",
    description:
      "Ask natural questions about your expenses, debts, and spending history. Balancio AI queries your groups to deliver immediate, contextual financial answers.",
    tag: "Natural Language AI",
    accentColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  },
];

export function FeaturesSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="features" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 sm:py-28">
      {/* Section Header */}
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent-blue">
          CORE CAPABILITIES
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-ink-primary">
          Designed for clarity.
          <br />
          Built for trust.
        </h2>
        <p className="mt-4 text-base text-ink-secondary sm:text-lg">
          Everything your group needs to manage shared spending without awkward conversations or spreadsheet headaches.
        </p>
      </div>

      {/* 4 Feature Cards Grid */}
      <motion.div
        variants={shouldReduceMotion ? undefined : staggerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8"
      >
        {FEATURES.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={idx}
              variants={shouldReduceMotion ? undefined : fadeInUpVariants}
              whileHover={shouldReduceMotion ? undefined : { y: -4, transition: { duration: 0.2 } }}
              className="h-full"
            >
              <GlassCard className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[20px] border border-line-subtle p-7 sm:p-8 transition-all duration-300 hover:border-line-strong hover:shadow-lift">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border ${feature.accentColor}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-pill border border-line-subtle bg-surface-2/60 px-3 py-1 text-[11px] font-medium text-ink-muted">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-ink-primary group-hover:text-accent-blue transition-colors">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm sm:text-base text-ink-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center text-xs font-semibold text-accent-blue opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Learn more</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

