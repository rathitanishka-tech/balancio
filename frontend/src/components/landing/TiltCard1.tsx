"use client";

import * as React from "react";
import { Tilt } from "@/components/core/tilt";
import { Logo } from "@/components/layout/Logo";
import { CheckCircle2, Bed, Utensils, Car, Users } from "lucide-react";

export function TiltCard1() {
  return (
    <div data-testid="hero-preview-stage" className="relative mx-auto w-full max-w-[420px] sm:max-w-[440px] xl:max-w-[460px] select-none">
      {/* Subtle Restrained Ambient Glow */}
      <div
        className="pointer-events-none absolute -inset-3 sm:-inset-6 z-0 rounded-[2rem] bg-accent-blue/10 blur-2xl opacity-60 dark:opacity-80 transition-opacity"
        aria-hidden="true"
      />

      <Tilt rotationFactor={8} isRevese>
        <div className="relative z-10 overflow-hidden rounded-xl border border-zinc-950/10 bg-white shadow-xl dark:border-zinc-50/10 dark:bg-zinc-900 dark:shadow-2xl transition-shadow duration-300 hover:shadow-glow-blue">
          {/* Compact Header: Balancio Logo & "Group overview" */}
          <div className="flex items-center justify-between border-b border-line-subtle px-5 py-3.5 bg-surface-2/40">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-pill border border-line-subtle bg-surface-1 px-2.5 py-1 text-xs font-medium text-ink-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-blue animate-pulse" />
              <span>Group overview</span>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            {/* Prominent "Weekend Trip" Group Label & Total Shared Expenses */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-blue">
                  WEEKEND TRIP
                </span>
                <span className="text-xs font-medium text-ink-muted flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> 5 members
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <p className="text-xs text-ink-secondary">Total shared expenses</p>
                  <p className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink-primary mt-0.5">
                    ₹8,400
                  </p>
                </div>
                {/* Group Member Avatars */}
                <div className="flex items-center -space-x-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-blue/20 text-[10px] font-bold text-accent-blue ring-2 ring-surface-1">
                    AS
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-emerald/20 text-[10px] font-bold text-accent-emerald ring-2 ring-surface-1">
                    RK
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-violet/20 text-[10px] font-bold text-accent-violet ring-2 ring-surface-1">
                    MJ
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-[10px] font-semibold text-ink-muted ring-2 ring-surface-1">
                    +2
                  </div>
                </div>
              </div>
            </div>

            {/* Simple, Elegant Expense Breakdown */}
            <div className="space-y-2.5 rounded-card border border-line-subtle bg-surface-2/50 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Expense Breakdown
              </p>

              {/* Row 1: Accommodation */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-ctl bg-accent-blue/15 text-accent-blue">
                    <Bed className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink-primary">Accommodation</p>
                    <p className="text-[10px] text-ink-muted">Villa stay (2 nights)</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-ink-primary">₹4,800</span>
              </div>

              {/* Row 2: Food & Dining */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-ctl bg-accent-emerald/15 text-accent-emerald">
                    <Utensils className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink-primary">Food &amp; Dining</p>
                    <p className="text-[10px] text-ink-muted">Shared dinners &amp; snacks</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-ink-primary">₹2,400</span>
              </div>

              {/* Row 3: Transport */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-ctl bg-accent-violet/15 text-accent-violet">
                    <Car className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink-primary">Transport</p>
                    <p className="text-[10px] text-ink-muted">Fuel &amp; expressway toll</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-ink-primary">₹1,200</span>
              </div>
            </div>

            {/* Compact Footer: "Everyone's settled" / "All balances clear" */}
            <div className="flex items-center justify-between rounded-ctl border border-accent-emerald/20 bg-accent-emerald/10 px-3.5 py-2.5 text-xs text-accent-emerald">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Everyone&apos;s settled</span>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-accent-emerald/80">
                All balances clear
              </span>
            </div>
          </div>
        </div>
      </Tilt>
    </div>
  );
}

