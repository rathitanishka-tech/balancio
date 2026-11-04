"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ProductHeroFrame } from "./ProductHeroFrame";

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
    <section className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 lg:pt-18 pb-16 sm:pb-24 lg:pb-28">
      {/* Asymmetric Two-Column Editorial Grid */}
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10 xl:gap-14">
        
        {/* LEFT AREA (5 Cols on Desktop): Typography, Value & Actions */}
        <div className="lg:col-span-5 flex flex-col items-start text-left max-w-xl">
          
          {/* Eyebrow Label */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-black/[0.02] px-3 py-1 text-xs font-semibold tracking-wide text-neutral-600 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-neutral-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#4D8DFF]" />
            <span>YOUR MONEY, IN BETTER BALANCE</span>
          </motion.div>

          {/* Main Headline — Clean, Confident, Editorial */}
          <motion.h1
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-3xl sm:text-4xl lg:text-[2.75rem] xl:text-[3.25rem] font-bold tracking-tight text-neutral-900 dark:text-[#F4F6FA] leading-[1.12]"
          >
            <span>Good times together.</span>
            <br />
            <span className="text-[#4D8DFF]">Money, sorted.</span>
          </motion.h1>

          {/* Supporting Description */}
          <motion.p
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 text-base sm:text-lg text-neutral-600 dark:text-[#929BAA] leading-relaxed max-w-lg"
          >
            Shared expenses without the awkwardness. Track spending, settle up, and keep every group in balance.
          </motion.p>

          {/* Primary & Secondary CTA Group */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 flex flex-col w-full sm:w-auto sm:flex-row sm:items-center gap-3.5"
          >
            <Button
              onClick={handlePrimaryCTA}
              className="h-11 sm:h-12 px-6 rounded-lg bg-[#4D8DFF] text-white font-medium hover:bg-[#3d7be6] transition-colors shadow-sm flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              onClick={handleExploreClick}
              className="h-11 sm:h-12 px-5 rounded-lg border-black/[0.1] bg-transparent text-neutral-900 font-medium hover:bg-black/[0.04] dark:border-white/[0.1] dark:text-[#F4F6FA] dark:hover:bg-white/[0.05] transition-colors text-sm sm:text-base flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              Explore Balancio
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </Button>
          </motion.div>

          {/* Small Supporting Line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6 text-xs sm:text-sm font-medium text-neutral-500 dark:text-[#627085]"
          >
            Built for groups, roommates, trips, and everyday life.
          </motion.p>
        </div>

        {/* RIGHT AREA (7 Cols on Desktop): Cohesive Realistic Product Showcase */}
        <div className="lg:col-span-7 flex items-center justify-center w-full">
          <ProductHeroFrame />
        </div>

      </div>
    </section>
  );
}
