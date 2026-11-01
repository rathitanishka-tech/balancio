"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { LiquidButton, GlassCard } from "@/components/glass";
import { useAuth } from "@/hooks/useAuth";
import { fadeInUpVariants } from "./motionVariants";

export function ClosingCTASection() {
  const router = useRouter();
  const { user, status } = useAuth();
  const shouldReduceMotion = useReducedMotion();

  const isAuthenticated = status === "authenticated" && !!user;

  function handleCTA() {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/register");
    }
  }

  return (
    <section className="relative mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8 sm:py-32">
      {/* Ambient Blue Bloom Glow Backdrop */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[320px] w-[600px] rounded-full bg-gradient-to-r from-accent-blue/20 via-accent-cyan/15 to-indigo-500/10 blur-[130px] -z-10"
        aria-hidden="true"
      />

      <motion.div
        variants={shouldReduceMotion ? undefined : fadeInUpVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        <GlassCard className="relative overflow-hidden rounded-[28px] border border-line-strong p-8 sm:p-14 text-center shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-blue/15 text-accent-blue mb-6">
            <Sparkles className="h-6 w-6" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-ink-primary max-w-2xl mx-auto leading-tight">
            Make money between friends feel simple.
          </h2>

          <p className="mt-4 text-base sm:text-lg text-ink-secondary max-w-xl mx-auto leading-relaxed">
            Less confusion around shared spending. More clarity for everyone.
          </p>

          <div className="mt-8 flex justify-center">
            <LiquidButton
              onClick={handleCTA}
              className="h-13 px-8 text-base shadow-glow-blue"
            >
              {isAuthenticated ? "Go to Dashboard" : "Start Using Balancio"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </LiquidButton>
          </div>

          <p className="mt-4 text-xs font-medium text-ink-muted">
            Free forever for personal groups &bull; No credit card required
          </p>
        </GlassCard>
      </motion.div>
    </section>
  );
}

