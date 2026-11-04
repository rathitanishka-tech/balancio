"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Tilt } from "@/components/core/tilt";
import {
  CheckCircle2,
  Bed,
  Utensils,
  Car,
  Users,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export function ProductHeroFrame() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      data-testid="hero-preview-stage"
      className="relative w-full max-w-[560px] lg:max-w-none select-none"
    >
      {/* Restrained 3D Perspective Tilt on Desktop */}
      <Tilt rotationFactor={4} isReverse>
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-xl border border-black/[0.08] bg-white shadow-xl dark:border-white/[0.08] dark:bg-[#0B0F17] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300"
        >
          {/* 1. Cohesive Window Titlebar */}
          <div className="flex h-11 items-center justify-between border-b border-black/[0.06] bg-black/[0.015] px-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-black/15 dark:bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-black/15 dark:bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-black/15 dark:bg-white/15" />
              <span className="ml-2 font-mono text-[11px] text-neutral-400 dark:text-neutral-500 hidden sm:inline">
                balancio / groups / weekend-trip
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.06] bg-white/80 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600 shadow-sm dark:border-white/[0.08] dark:bg-[#121824] dark:text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4D8DFF]" />
              <span>Group overview</span>
            </div>
          </div>

          {/* 2. Main Dashboard Interface Body */}
          <div className="p-5 sm:p-6 space-y-5">
            
            {/* Top Row: Group Identity & Integrated "Your Balance" Metric */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              
              {/* Group Meta (7 Cols) */}
              <div className="sm:col-span-7 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wider text-[#4D8DFF] uppercase">
                    WEEKEND TRIP
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <Users className="h-3 w-3" /> 5 members
                  </span>
                </div>

                <div className="flex items-baseline justify-between sm:justify-start sm:gap-4 pt-1">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Total shared expenses</p>
                    <p className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-[#F4F6FA] mt-0.5">
                      ₹8,400
                    </p>
                  </div>

                  {/* Avatar Stack */}
                  <div className="flex items-center -space-x-1.5 self-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4D8DFF]/15 text-[10px] font-bold text-[#4D8DFF] ring-2 ring-white dark:ring-[#0B0F17]">
                      AS
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-500 ring-2 ring-white dark:ring-[#0B0F17]">
                      RK
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/15 text-[10px] font-bold text-indigo-400 ring-2 ring-white dark:ring-[#0B0F17]">
                      MJ
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 ring-2 ring-white dark:ring-[#0B0F17]">
                      +2
                    </div>
                  </div>
                </div>
              </div>

              {/* Integrated "Your Balance" Block (5 Cols) */}
              <div className="sm:col-span-5 rounded-lg border border-black/[0.06] bg-black/[0.02] p-3 dark:border-white/[0.06] dark:bg-white/[0.03]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    Your Balance
                  </span>
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                    In credit
                  </span>
                </div>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  +₹1,680
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                  Sarah settled ₹1,200 via UPI
                </p>
              </div>

            </div>

            {/* Middle Section: Expense Breakdown */}
            <div className="rounded-lg border border-black/[0.06] bg-black/[0.015] p-3.5 sm:p-4 dark:border-white/[0.06] dark:bg-white/[0.02] space-y-2.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-[11px] font-semibold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase">
                  Expense Breakdown
                </span>
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                  3 categories
                </span>
              </div>

              {/* Row 1: Accommodation */}
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-[#4D8DFF]/10 text-[#4D8DFF]">
                    <Bed className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900 dark:text-[#F4F6FA]">Accommodation</span>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 ml-2 hidden sm:inline">Villa stay (2 nights)</span>
                  </div>
                </div>
                <span className="font-semibold text-neutral-900 dark:text-[#F4F6FA]">₹4,800</span>
              </div>

              {/* Row 2: Food & Dining */}
              <div className="flex items-center justify-between text-xs py-1.5 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-500">
                    <Utensils className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900 dark:text-[#F4F6FA]">Food &amp; Dining</span>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 ml-2 hidden sm:inline">Shared dinners &amp; snacks</span>
                  </div>
                </div>
                <span className="font-semibold text-neutral-900 dark:text-[#F4F6FA]">₹2,400</span>
              </div>

              {/* Row 3: Transport */}
              <div className="flex items-center justify-between text-xs py-1">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-500/10 text-indigo-400">
                    <Car className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900 dark:text-[#F4F6FA]">Transport</span>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500 ml-2 hidden sm:inline">Fuel &amp; expressway toll</span>
                  </div>
                </div>
                <span className="font-semibold text-neutral-900 dark:text-[#F4F6FA]">₹1,200</span>
              </div>
            </div>

            {/* Bottom Row: Settlement Status & Recent Activity Stream */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              
              {/* Settlement Status Banner */}
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3.5 py-2.5 text-xs text-emerald-600 dark:text-emerald-400">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Everyone&apos;s settled</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">
                  All balances clear
                </span>
              </div>

              {/* Integrated Recent Activity Bar */}
              <div className="flex items-center justify-between rounded-lg border border-black/[0.06] bg-black/[0.02] px-3.5 py-2.5 text-xs text-neutral-600 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-neutral-400">
                <div className="flex items-center gap-2 truncate">
                  <ShieldCheck className="h-4 w-4 text-[#4D8DFF] shrink-0" />
                  <span className="font-medium text-neutral-900 dark:text-[#F4F6FA] truncate">
                    Recent Activity
                  </span>
                  <span className="text-[10px] text-neutral-400 hidden sm:inline">&bull; 3 settled</span>
                </div>
                <span className="text-[10px] text-[#4D8DFF] font-medium shrink-0">
                  Synced
                </span>
              </div>

            </div>

          </div>
        </motion.div>
      </Tilt>
    </div>
  );
}

