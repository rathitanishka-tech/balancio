"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { LiquidButton } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { TiltCard1 } from "./TiltCard1";

export function HeroSection() {
  const router = useRouter();
  const { user, status } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const isAuthenticated = status === "authenticated" && !!user;

  function handlePrimaryCTA() {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/register");
    }
  }

  function handleExploreClick() {
    const target = document.getElementById("features") || document.getElementById("how-it-works");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <section className="relative mx-auto max-w-7xl px-4 pt-6 sm:pt-10 lg:pt-14 pb-12 sm:pb-16 lg:pb-24">
      {/* Responsive Two-Column Grid */}
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-16">
        
        {/* Left Column (5 Cols on Desktop): Messaging, Value Proposition & Actions */}
        <div className="flex flex-col items-start text-left lg:col-span-5 z-10 max-w-xl">
          
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-pill border border-line-strong bg-surface-2/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-accent-blue shadow-sm backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-cyan" />
            <span>YOUR MONEY, IN BETTER BALANCE</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-3xl sm:text-5xl lg:text-[2.65rem] xl:text-[3.15rem] font-extrabold tracking-tight leading-[1.12] text-ink-primary"
          >
            <span>Good times together.</span>
            <br />
            <span className="bg-gradient-to-r from-accent-blue via-accent-cyan to-indigo-400 bg-clip-text text-transparent drop-shadow-sm">
              Money, sorted.
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-lg text-base sm:text-lg text-ink-secondary leading-relaxed"
          >
            Shared expenses without the awkwardness. Track spending, settle up, and keep every group in balance.
          </motion.p>

          {/* Primary & Secondary Action Group */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 flex flex-col w-full sm:w-auto gap-3.5 sm:flex-row sm:items-center sm:gap-4"
          >
            <LiquidButton
              onClick={handlePrimaryCTA}
              className="h-12 sm:h-13 px-7 text-base shadow-glow-blue w-full sm:w-auto justify-center"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </LiquidButton>

            <Button
              variant="outline"
              size="lg"
              onClick={handleExploreClick}
              className="h-12 sm:h-13 border-line-strong bg-surface-1 px-6 text-base font-medium text-ink-primary shadow-soft hover:bg-surface-2 transition-colors w-full sm:w-auto justify-center"
            >
              Explore Balancio
              <ChevronDown className="h-4 w-4 ml-2 text-ink-muted" />
            </Button>
          </motion.div>

          {/* Supporting Line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-6 text-xs sm:text-sm font-medium text-ink-muted"
          >
            Built for groups, roommates, trips, and everyday life.
          </motion.p>
        </div>

        {/* Right Column (7 Cols on Desktop): Single Interactive 3D Tilt Card */}
        <div className="relative w-full lg:col-span-7 flex items-center justify-center">
          <TiltCard1 />
        </div>

      </div>
    </section>
  );
}
