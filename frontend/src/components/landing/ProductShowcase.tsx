"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Users,
  Bot,
  ArrowRightLeft,
  Receipt,
  CheckCircle2,
  PieChart,
  MessageSquare
} from "lucide-react";
import { GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatters/currency";
import { DebtSimplificationVisual } from "./DebtSimplificationVisual";
import { fadeInUpVariants } from "./motionVariants";

type ShowcaseTab = "simplification" | "balances" | "ai";

export function ProductShowcase() {
  const [activeTab, setActiveTab] = React.useState<ShowcaseTab>("simplification");
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="preview" className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 sm:py-28">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-accent-blue">
          PRODUCT SHOWCASE
        </span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-ink-primary">
          A clearer picture of your money.
        </h2>
        <p className="mt-4 text-base text-ink-secondary sm:text-lg">
          Explore how Balancio simplifies messy IOUs, balances group ledgers, and gives you instant financial answers.
        </p>

        {/* Tab Switcher */}
        <div className="mt-8 inline-flex items-center rounded-panel border border-line-strong bg-surface-2/80 p-1.5 shadow-soft backdrop-blur-md">
          {[
            { id: "simplification", label: "Debt Simplification", icon: Sparkles },
            { id: "balances", label: "Group Ledger", icon: ArrowRightLeft },
            { id: "ai", label: "AI Financial Assistant", icon: Bot },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as ShowcaseTab)}
                className={`flex items-center gap-2 rounded-ctl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-accent-blue text-white shadow-soft"
                    : "text-ink-secondary hover:text-ink-primary hover:bg-surface-3/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Display Card */}
      <motion.div
        variants={shouldReduceMotion ? undefined : fadeInUpVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
        className="mt-12"
      >
        <GlassCard className="overflow-hidden rounded-[24px] border border-line-strong p-6 sm:p-10 shadow-2xl backdrop-blur-2xl">
          <AnimatePresence mode="wait">
            {activeTab === "simplification" && (
              <motion.div
                key="simplification"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12"
              >
                <div className="lg:col-span-5 space-y-4">
                  <span className="rounded-pill bg-accent-blue/10 px-3 py-1 text-xs font-semibold text-accent-blue">
                    Smart Graph Algorithm
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-primary">
                    Fewer transactions.<br />Zero awkward math.
                  </h3>
                  <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
                    When 4 friends split expenses on a trip, a tangled web of 5 separate IOUs can quickly cause confusion. Balancio&apos;s debt simplification algorithm collapses reciprocal obligations into just 2 minimal settlements.
                  </p>
                  <div className="pt-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-accent-emerald">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mathematically minimizes net bank transfers</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 flex justify-center items-center py-4">
                  <div className="w-full max-w-md rounded-2xl border border-line-subtle bg-surface-2/40 p-4">
                    <DebtSimplificationVisual />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "balances" && (
              <motion.div
                key="balances"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12"
              >
                <div className="lg:col-span-5 space-y-4">
                  <span className="rounded-pill bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
                    Live Ledger & Settle Up
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-primary">
                    Real-time balances.<br />Always reconciled.
                  </h3>
                  <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
                    View individual and collective group balances instantly. When someone makes a payment, tap &ldquo;Settle Up&rdquo; to record the transfer and keep everyone updated in real-time.
                  </p>
                  <div className="pt-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-accent-cyan">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Server-side verified transaction history</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  {[
                    { name: "Rahul Sharma", role: "Owes you", amount: 18500, positive: true, avatar: "RS" },
                    { name: "Priya Patel", role: "You owe", amount: 12000, positive: false, avatar: "PP" },
                    { name: "Aman Verma", role: "Owes you", amount: 8400, positive: true, avatar: "AV" },
                    { name: "Sarah Khan", role: "All settled up", amount: 0, positive: null, avatar: "SK" },
                  ].map((member, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-card border border-line-subtle bg-surface-2/50 p-4 transition-colors hover:bg-surface-2"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-blue/15 text-accent-blue text-xs font-bold">
                          {member.avatar}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink-primary">{member.name}</p>
                          <p className="text-xs text-ink-muted">{member.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span
                          className={`text-sm sm:text-base font-bold ${
                            member.positive === true
                              ? "text-accent-emerald"
                              : member.positive === false
                              ? "text-accent-rose"
                              : "text-ink-muted"
                          }`}
                        >
                          {member.amount === 0 ? "₹0.00" : formatMoney(member.amount)}
                        </span>
                        {member.amount > 0 && (
                          <span className="hidden sm:inline-block rounded-pill bg-surface-1 border border-line-subtle px-3 py-1 text-xs font-semibold text-ink-primary">
                            Settle Up
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "ai" && (
              <motion.div
                key="ai"
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12"
              >
                <div className="lg:col-span-5 space-y-4">
                  <span className="rounded-pill bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
                    Natural Language Queries
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-primary">
                    Financial insights,<br />delivered instantly.
                  </h3>
                  <p className="text-sm sm:text-base text-ink-secondary leading-relaxed">
                    No need to sift through receipts or calculate monthly sums. Simply ask Balancio AI about your past spending, category trends, or pending debts to get concise, accurate summaries.
                  </p>
                  <div className="pt-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-accent-blue">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Context-aware intelligence across all your groups</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7">
                  <div className="rounded-2xl border border-line-subtle bg-surface-2/60 p-5 space-y-4">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-accent-blue text-white px-4 py-2.5 text-sm shadow-md">
                        What are my top 3 expenses from last month&apos;s Goa trip?
                      </div>
                    </div>

                    {/* AI response */}
                    <div className="flex justify-start">
                      <div className="max-w-[90%] rounded-2xl rounded-tl-sm border border-line-subtle bg-surface-1 p-4 text-sm shadow-soft">
                        <div className="flex items-center gap-2 text-xs font-bold text-accent-blue mb-2">
                          <Bot className="h-4 w-4" />
                          <span>Balancio AI Assistant</span>
                        </div>
                        <p className="text-ink-primary leading-relaxed">
                          Here are the top 3 expenses from your <strong>Goa Trip</strong> group:
                        </p>
                        <ul className="mt-2.5 space-y-2 text-xs sm:text-sm text-ink-secondary">
                          <li className="flex justify-between border-b border-line-subtle pb-1">
                            <span>1. Heritage Beach Villa (3 nights)</span>
                            <strong className="text-ink-primary">₹72,000</strong>
                          </li>
                          <li className="flex justify-between border-b border-line-subtle pb-1">
                            <span>2. Seafood & Grill Dinner</span>
                            <strong className="text-ink-primary">₹14,400</strong>
                          </li>
                          <li className="flex justify-between">
                            <span>3. Scuba & Watersports</span>
                            <strong className="text-ink-primary">₹12,000</strong>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </section>
  );
}
