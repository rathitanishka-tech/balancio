"use client";

import * as React from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Wallet,
  HandCoins,
  CheckCircle2,
} from "lucide-react";
import { StatCard, PageHeader } from "@/components/common";
import { SpendingChartView, type Granularity } from "@/components/dashboard/SpendingChart";
import { formatMoney } from "@/lib/formatters/currency";

// Illustrative demo data matching the actual dashboard analytics
const DEMO_MONTHLY_SPENDING = [
  { label: "Nov", spending: 18000 },
  { label: "Dec", spending: 24500 },
  { label: "Jan", spending: 31200 },
  { label: "Feb", spending: 22800 },
  { label: "Mar", spending: 38400 },
  { label: "Apr", spending: 45200 },
];

const DEMO_WEEKLY_SPENDING = [
  { label: "W1", spending: 4200 },
  { label: "W2", spending: 8600 },
  { label: "W3", spending: 11400 },
  { label: "W4", spending: 9800 },
];

export function HeroDashboardPreview() {
  const shouldReduceMotion = useReducedMotion();
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [granularity, setGranularity] = React.useState<Granularity>("monthly");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches);
    }
  }, []);

  // Restrained Framer Motion spring physics for subtle outer frame tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 120, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Very subtle parallax mapping strictly on the outer container
  const dashboardX = useTransform(smoothX, [-0.5, 0.5], [4, -4]);
  const dashboardY = useTransform(smoothY, [-0.5, 0.5], [4, -4]);
  const dashboardRotateX = useTransform(smoothY, [-0.5, 0.5], [-0.8, 0.8]);
  const dashboardRotateY = useTransform(smoothX, [-0.5, 0.5], [0.8, -0.8]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || isTouchDevice) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      data-testid="hero-preview-stage"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: 1200 }}
      className="relative mx-auto w-full max-w-xl lg:max-w-none select-none"
    >
      {/* Single Restrained Blue Ambient Glow Backdrop */}
      <div
        className="pointer-events-none absolute -inset-2 sm:-inset-4 z-0 rounded-[2rem] bg-accent-blue/10 blur-2xl opacity-60 dark:opacity-80 transition-opacity"
        aria-hidden="true"
      />

      {/* Main Product Window Frame */}
      <motion.div
        style={{
          x: shouldReduceMotion ? 0 : dashboardX,
          y: shouldReduceMotion ? 0 : dashboardY,
          rotateX: shouldReduceMotion ? 0 : dashboardRotateX,
          rotateY: shouldReduceMotion ? 0 : dashboardRotateY,
          transformStyle: "preserve-3d",
        }}
        initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 overflow-hidden rounded-panel border border-line-strong bg-surface-1/95 shadow-xl backdrop-blur-xl transition-shadow duration-300 hover:shadow-glow-blue"
      >
        {/* Window Titlebar */}
        <div className="flex h-10 items-center justify-between border-b border-line-subtle bg-surface-2/60 px-3.5 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-xs font-medium text-ink-muted hidden sm:inline">
              balancio.app / dashboard
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-pill border border-line-subtle bg-surface-1/80 px-2.5 py-0.5 text-[11px] font-medium text-accent-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-emerald animate-pulse" />
            Live Balance Ledger
          </div>
        </div>

        {/* Dashboard Workspace Presentation */}
        <div className="p-4 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
          {/* Header Greeting */}
          <PageHeader
            title="Good morning, Alex"
            description="Here's what's happening with your expenses."
            className="gap-0.5"
          />

          {/* 2 Wide, Generous Balance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <StatCard
              label="You are owed"
              value={8640000} // 86,400 INR
              formatValue={(v) => formatMoney(v)}
              tone="positive"
              icon={<Wallet className="h-4 w-4" />}
              trend={{ direction: "up", label: "From 3 group members" }}
              className="p-4 sm:p-5"
            />
            <StatCard
              label="You owe"
              value={2400000} // 24,000 INR
              formatValue={(v) => formatMoney(v)}
              tone="negative"
              icon={<HandCoins className="h-4 w-4" />}
              trend={{ direction: "down", label: "Ready to settle up" }}
              className="p-4 sm:p-5"
            />
          </div>

          {/* Spending Overview Area Chart */}
          <SpendingChartView
            data={granularity === "monthly" ? DEMO_MONTHLY_SPENDING : DEMO_WEEKLY_SPENDING}
            granularity={granularity}
            onGranularityChange={setGranularity}
            chartHeight={175}
            className="p-4 sm:p-5"
          />
        </div>
      </motion.div>

      {/* Exactly One Subtle Floating Settlement Card (Hidden on Mobile to Prevent Overflow) */}
      <div
        className="hidden sm:flex absolute -bottom-3.5 right-4 sm:right-6 z-20 items-center gap-2.5 rounded-card border border-line-strong bg-surface-3/95 px-3.5 py-2 shadow-lift backdrop-blur-xl"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-emerald/15 text-accent-emerald">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-ink-primary">Settlement Verified</p>
          <p className="text-[10px] text-ink-muted">Sarah settled ₹3,200 via UPI &bull; Just now</p>
        </div>
      </div>
    </div>
  );
}
