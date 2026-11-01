"use client";

import * as React from "react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export function LandingFooter() {
  return (
    <footer className="border-t border-line-subtle bg-surface-1/60 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block focus-ring rounded-ctl" aria-label="Balancio Home">
              <Logo />
            </Link>
            <p className="text-sm text-ink-secondary max-w-sm leading-relaxed">
              Balancio is an intelligent expense-sharing workspace. Track group costs, simplify reciprocal debts, and settle up with confidence.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-primary">
              Product
            </p>
            <ul className="space-y-2 text-sm text-ink-secondary">
              <li>
                <a href="#features" className="hover:text-accent-blue transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-accent-blue transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#preview" className="hover:text-accent-blue transition-colors">
                  Product Preview
                </a>
              </li>
            </ul>
          </div>

          {/* Account & App Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-primary">
              Account
            </p>
            <ul className="space-y-2 text-sm text-ink-secondary">
              <li>
                <Link href="/login" className="hover:text-accent-blue transition-colors">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-accent-blue transition-colors">
                  Create account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-accent-blue transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="mt-10 border-t border-line-subtle pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-muted gap-4">
          <p>&copy; {new Date().getFullYear()} Balancio. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Designed with Midnight Finance precision &bull; Built on Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}

