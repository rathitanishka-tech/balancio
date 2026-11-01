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
    <div className="relative min-h-screen overflow-x-hidden bg-bg-base text-ink-primary transition-colors duration-500">
      
      {/* Ambient Lighting & Grid Detail (Midnight Finance) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 bg-midnight-grid opacity-70" />

        {/* Ambient radial lighting blooms */}
        <div className="absolute -top-[15%] -left-[10%] h-[60vh] w-[55vw] rounded-full bg-accent-blue/15 blur-[140px] mix-blend-screen" />
        <div className="absolute top-[25%] -right-[15%] h-[60vh] w-[45vw] rounded-full bg-accent-cyan/12 blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] h-[50vh] w-[60vw] rounded-full bg-indigo-600/10 blur-[140px] mix-blend-screen" />
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

