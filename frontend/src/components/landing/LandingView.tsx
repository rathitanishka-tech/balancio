"use client";

import * as React from "react";
import { LandingNavbar } from "./LandingNavbar";
import { HeroSection } from "./HeroSection";
import { ValueStrip } from "./ValueStrip";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { ProductShowcase } from "./ProductShowcase";
import { ClosingCTASection } from "./ClosingCTASection";
import { LandingFooter } from "./LandingFooter";

export function LandingView() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fafafa] dark:bg-[#080B12] text-neutral-900 dark:text-[#F4F6FA] transition-colors duration-300">
      
      {/* Quiet, Subtle Tonal Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/[0.015] dark:to-white/[0.01]" />
      </div>

      {/* Navigation */}
      <LandingNavbar />

      {/* Main Content */}
      <main className="relative z-10 pt-16 sm:pt-20">
        <HeroSection />
        <ValueStrip />
        <FeaturesSection />
        <HowItWorksSection />
        <ProductShowcase />
        <ClosingCTASection />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}

