"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  PieChart,
  MessageSquareText,
  Users,
  Wallet,
  ArrowRightLeft,
  Lock,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Bot,
  Receipt,
  Check
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LiquidButton, GlassCard } from "@/components/glass";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/formatters/currency";
import { DebtSimplificationVisual } from "@/components/landing/DebtSimplificationVisual";

export default function LandingPage() {
  const router = useRouter();
  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 50], [0.7, 0.95]);
  const navBlur = useTransform(scrollY, [0, 50], ["blur(8px)", "blur(16px)"]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-bg-base bg-noise text-ink-primary transition-colors duration-500">
      
      {/* Ambient Backgrounds */}
      <div className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[50vh] w-[50vw] rounded-full bg-accent-violet/10 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] h-[60vh] w-[40vw] rounded-full bg-accent-cyan/10 blur-[140px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] h-[40vh] w-[60vw] rounded-full bg-accent-indigo/10 blur-[120px] mix-blend-screen" />
      </div>

      {/* Premium Navbar */}
      <motion.header 
        style={{ backgroundColor: `color-mix(in srgb, var(--bg-base) 80%, transparent)`, backdropFilter: navBlur }}
        className="fixed top-0 z-50 w-full border-b border-line-subtle transition-shadow duration-300"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary">Features</a>
              <a href="#ai" className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary">AI Assistant</a>
              <a href="#security" className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary">Security</a>
              <a href="#pricing" className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary">Pricing</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login" className="hidden text-sm font-medium text-ink-secondary transition-colors hover:text-ink-primary sm:block">
              Log in
            </Link>
            <LiquidButton onClick={() => router.push("/register")} className="scale-90 sm:scale-100">
              Get Started
            </LiquidButton>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 pt-24">
        
        {/* HERO SECTION */}
        <section className="mx-auto flex max-w-7xl flex-col items-center px-6 pb-20 pt-8 text-center sm:pt-12 lg:pt-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-6 rounded-pill border border-line-subtle bg-surface-1 px-4 py-1.5 text-xs font-semibold tracking-widest text-ink-secondary shadow-soft"
          >
            AI-POWERED FINANCIAL WORKSPACE
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-5xl font-semibold leading-[1.1] tracking-tighter sm:text-7xl lg:text-[5rem]"
          >
            Manage money together.<br />
            <span className="bg-gradient-to-r from-accent-violet via-accent-indigo to-accent-cyan bg-clip-text text-transparent drop-shadow-sm">
              Understand it instantly.
            </span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="mt-8 max-w-2xl text-lg text-ink-secondary sm:text-xl"
          >
            A collaborative financial workspace for shared expenses,
            smart settlements, spending insights and AI-powered assistance.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <LiquidButton onClick={() => router.push("/register")} className="px-8 py-6 text-base">
              Get Started Free
            </LiquidButton>
            <Button variant="outline" size="lg" className="border-line-strong bg-surface-1 px-8 py-6 text-base shadow-soft hover:bg-surface-2" onClick={() => {
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              See how it works
            </Button>
          </motion.div>

          {/* Trust Strip */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="mt-16 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-ink-muted sm:gap-x-12"
          >
            <span className="flex items-center gap-2"><PieChart className="h-4 w-4" /> Smart expense splitting</span>
            <span className="flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> Real-time balances</span>
            <span className="flex items-center gap-2"><Bot className="h-4 w-4" /> AI financial assistant</span>
            <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Secure data</span>
          </motion.div>

          {/* Hero Visual - Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative mt-20 w-full max-w-5xl perspective-1000"
          >
            <div className="absolute -inset-4 z-[-1] rounded-[2rem] bg-gradient-to-b from-accent-violet/20 to-transparent blur-2xl" />
            <GlassCard className="glass-surface-strong relative overflow-hidden rounded-[24px] border border-line-strong p-0 shadow-2xl transition-transform hover:scale-[1.01] hover:shadow-glow">
              <div className="liquid-sheen" />
              
              {/* App UI Mock */}
              <div className="flex h-12 items-center border-b border-line-subtle bg-surface-1 px-6">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-accent-rose/50" />
                  <div className="h-3 w-3 rounded-full bg-accent-cyan/50" />
                  <div className="h-3 w-3 rounded-full bg-accent-emerald/50" />
                </div>
                <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md bg-surface-2 text-xs text-ink-muted shadow-inner">
                  balancio.app / dashboard
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3">
                {/* Left Sidebar */}
                <div className="border-r border-line-subtle bg-bg-base/30 p-6 md:col-span-2">
                  <div className="mb-8 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-line-subtle bg-surface-1 p-5 shadow-sm">
                      <p className="text-sm font-medium text-ink-muted">You owe</p>
                      <p className="mt-2 text-3xl font-semibold text-accent-rose">{formatMoney(24000)}</p>
                    </div>
                    <div className="rounded-xl border border-line-subtle bg-surface-1 p-5 shadow-sm">
                      <p className="text-sm font-medium text-ink-muted">You are owed</p>
                      <p className="mt-2 text-3xl font-semibold text-accent-emerald">{formatMoney(86000)}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-muted">Recent Activity</h3>
                    <div className="space-y-3">
                      {[
                        { title: "Weekend Getaway Airbnb", date: "Today", amount: 120000, color: "violet" },
                        { title: "Dinner at Sushi Place", date: "Yesterday", amount: 45000, color: "blue" },
                        { title: "Internet Bill", date: "Sep 22", amount: 6000, color: "cyan" }
                      ].map((exp, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-1 p-4 shadow-sm transition-colors hover:bg-surface-2">
                          <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-full bg-accent-${exp.color}/10 flex items-center justify-center`}>
                              <Receipt className={`h-5 w-5 text-accent-${exp.color}`} />
                            </div>
                            <div>
                              <p className="font-medium text-ink-primary">{exp.title}</p>
                              <p className="text-xs text-ink-muted">{exp.date}</p>
                            </div>
                          </div>
                          <p className="font-semibold">{formatMoney(exp.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - AI Assistant */}
                <div className="bg-surface-1/50 p-6">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-accent-violet">
                    <Bot className="h-5 w-5" />
                    Balancio AI
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl rounded-tr-sm bg-accent-violet text-white p-3 text-sm shadow-md">
                      How much did I spend on food this month?
                    </div>
                    <div className="rounded-2xl rounded-tl-sm border border-line-subtle bg-surface-2 p-4 text-sm shadow-soft">
                      You spent <strong>{formatMoney(42800)}</strong> across 11 food expenses this month.
                      <div className="mt-3 h-16 w-full rounded border border-line-subtle bg-bg-base flex items-end gap-1 p-2">
                        <div className="w-1/4 rounded-t bg-accent-violet/30 h-[40%]" />
                        <div className="w-1/4 rounded-t bg-accent-violet/50 h-[70%]" />
                        <div className="w-1/4 rounded-t bg-accent-violet/70 h-[30%]" />
                        <div className="w-1/4 rounded-t bg-accent-violet h-[90%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </section>

        {/* FEATURES SECTION */}
        <section id="features" className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Everything you need to stay financially clear.</h2>
          </div>
          
          <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Row 1 */}
            <GlassCard className="group col-span-1 border-line-subtle p-8 transition-transform hover:-translate-y-1 hover:shadow-glow md:col-span-2">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent-indigo/10 text-accent-indigo">
                <PieChart className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-semibold text-ink-primary">Smart Expense Splitting</h3>
              <p className="mt-3 text-ink-secondary">Equal, percentage and custom splits. No matter how complicated the receipt is, Balancio handles the math effortlessly so you don&apos;t have to.</p>
            </GlassCard>
            
            <GlassCard className="group col-span-1 border-line-subtle p-8 transition-transform hover:-translate-y-1 hover:shadow-glow">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent-emerald/10 text-accent-emerald">
                <Wallet className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-semibold text-ink-primary">Automatic Balances</h3>
              <p className="mt-3 text-ink-secondary">Always know exactly who owes whom in real-time, verified securely on the server.</p>
            </GlassCard>

            {/* Row 2 */}
            <GlassCard className="group col-span-1 border-line-subtle p-8 transition-transform hover:-translate-y-1 hover:shadow-glow">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent-cyan/10 text-accent-cyan">
                <TrendingUp className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-semibold text-ink-primary">Settlements</h3>
              <p className="mt-3 text-ink-secondary">Record payments in a tap. Keep a clean history of when and how everyone got paid back.</p>
            </GlassCard>

            <GlassCard className="group col-span-1 border-line-subtle p-8 transition-transform hover:-translate-y-1 hover:shadow-glow md:col-span-2">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent-rose/10 text-accent-rose">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-semibold text-ink-primary">Financial Analytics</h3>
              <p className="mt-3 text-ink-secondary">Understand your shared spending patterns with beautiful, interactive charts. Track expenses by category, group, and time period seamlessly.</p>
            </GlassCard>
          </div>
        </section>

        {/* DEBT SIMPLIFICATION */}
        <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-24 sm:py-32">
          <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-transparent via-accent-violet/5 to-transparent" />
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Fewer payments.<br/>Less confusion.</h2>
              <p className="mt-6 text-lg text-ink-secondary">
                Our debt simplification algorithm mathematically minimizes the number of transactions needed to settle a group. A tangled web of IOUs collapses into a few simple payments.
              </p>
            </div>
            
            <GlassCard className="relative flex items-center justify-center p-8 sm:p-12 text-center lg:aspect-square">
              <div className="liquid-sheen" />
              <DebtSimplificationVisual />
            </GlassCard>
          </div>
        </section>

        {/* AI SECTION */}
        <section id="ai" className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Your finances, now conversational.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-secondary">
              Balancio AI understands your specific expenses, debts, and groups. Ask questions naturally and get instant financial clarity.
            </p>
          </div>

          <div className="mt-16 flex justify-center">
            <GlassCard className="w-full max-w-3xl glass-surface-strong p-2 shadow-2xl">
              <div className="rounded-[20px] bg-bg-base p-6">
                <div className="mb-6 flex items-center gap-3 border-b border-line-subtle pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-violet/20">
                    <Bot className="h-6 w-6 text-accent-violet" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Balancio AI</h3>
                    <p className="text-xs text-ink-muted">Always online to assist you</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* User Msg */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-surface-2 px-5 py-3 text-sm shadow-soft">
                      What do I owe right now?
                    </div>
                  </div>
                  {/* AI Msg */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-accent-violet/20 bg-accent-violet/5 px-5 py-3 text-sm shadow-soft">
                      <p>You have <strong>2 outstanding balances</strong> to settle:</p>
                      <ul className="mt-2 space-y-2">
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent-rose" />
                          You owe <strong>Sarah</strong> {formatMoney(45000)} for &quot;Weekend Trip&quot;
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent-rose" />
                          You owe <strong>Alex</strong> {formatMoney(12000)} for &quot;Utilities&quot;
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* User Msg */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-surface-2 px-5 py-3 text-sm shadow-soft">
                      How much did I spend on food this month?
                    </div>
                  </div>
                  {/* AI Msg */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-accent-violet/20 bg-accent-violet/5 px-5 py-3 text-sm shadow-soft">
                      <p>You spent <strong>{formatMoney(42800)}</strong> on food this month across 11 expenses.</p>
                      <p className="mt-2 text-ink-muted">That&apos;s 15% less than last month! 📉</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex items-center gap-2 rounded-pill border border-line-subtle bg-surface-1 px-4 py-3 text-sm text-ink-muted">
                  <MessageSquareText className="h-4 w-4" />
                  Ask about your expenses...
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* USE CASES */}
        <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-6">
              <h3 className="text-xl font-semibold">Trips</h3>
              <p className="mt-2 text-sm text-ink-secondary">Split hotels, food, and transport without doing math on a napkin.</p>
            </div>
            <div className="border-t border-line-subtle p-6 sm:border-l sm:border-t-0">
              <h3 className="text-xl font-semibold">Roommates</h3>
              <p className="mt-2 text-sm text-ink-secondary">Keep track of rent, groceries, and utilities seamlessly every month.</p>
            </div>
            <div className="border-t border-line-subtle p-6 lg:border-l lg:border-t-0">
              <h3 className="text-xl font-semibold">Friends</h3>
              <p className="mt-2 text-sm text-ink-secondary">Share dinners, events, and activities without the awkwardness.</p>
            </div>
            <div className="border-t border-line-subtle p-6 sm:border-l sm:border-t-0 lg:border-t-0">
              <h3 className="text-xl font-semibold">Teams</h3>
              <p className="mt-2 text-sm text-ink-secondary">Track shared project expenses and team lunches elegantly.</p>
            </div>
          </div>
        </section>

        {/* PRICING SECTION */}
        <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Simple, transparent pricing.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-secondary">
              Start for free, upgrade when you need advanced financial superpowers.
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            {/* Free Tier */}
            <GlassCard className="flex flex-col border-line-subtle p-8 shadow-soft">
              <h3 className="text-2xl font-semibold">Starter</h3>
              <div className="mt-4 flex items-baseline text-5xl font-bold tracking-tight text-ink-primary">
                ₹0
                <span className="ml-1 text-lg font-medium text-ink-muted">/mo</span>
              </div>
              <p className="mt-4 text-sm text-ink-secondary">Everything you need to manage shared expenses.</p>
              <ul className="mt-8 flex-1 space-y-4">
                {['Unlimited groups', 'Unlimited expenses', 'Smart debt simplification', 'Basic settlements', 'Real-time balances'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-ink-secondary">
                    <Check className="h-4 w-4 text-accent-emerald" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="mt-8 w-full border-line-strong bg-surface-1 shadow-soft" onClick={() => router.push("/register")}>
                Get Started Free
              </Button>
            </GlassCard>

            {/* Pro Tier */}
            <GlassCard className="glass-surface-strong relative flex flex-col border-accent-violet/30 p-8 shadow-2xl">
              <div className="absolute -top-4 right-8 rounded-pill bg-gradient-to-r from-accent-violet to-accent-indigo px-3 py-1 text-xs font-semibold text-white shadow-glow">
                Most Popular
              </div>
              <h3 className="text-2xl font-semibold text-accent-violet">Balancio Pro</h3>
              <div className="mt-4 flex items-baseline text-5xl font-bold tracking-tight text-ink-primary">
                ₹399
                <span className="ml-1 text-lg font-medium text-ink-muted">/mo</span>
              </div>
              <p className="mt-4 text-sm text-ink-secondary">Advanced intelligence for your shared finances.</p>
              <ul className="mt-8 flex-1 space-y-4">
                {['Everything in Starter', 'Unlimited AI Assistant', 'Advanced analytics & charts', 'Custom export formats', 'Priority support'].map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-ink-primary font-medium">
                    <Check className="h-4 w-4 text-accent-violet" />
                    {feature}
                  </li>
                ))}
              </ul>
              <LiquidButton className="mt-8 w-full" onClick={() => router.push("/register")}>
                Upgrade to Pro
              </LiquidButton>
            </GlassCard>
          </div>
        </section>

        {/* SECURITY & PRIVACY */}
        <section id="security" className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <ShieldCheck className="mx-auto mb-6 h-12 w-12 text-accent-emerald" />
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your money deserves clarity.<br/>Your data deserves privacy.</h2>
            <p className="mt-6 text-lg text-ink-secondary">
              Balancio is built on a secure, server-side verified architecture. Every transaction is authenticated, authorized, and strictly scoped to your groups.
            </p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-7xl px-6 py-24 sm:py-32 border-y border-line-subtle">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              { num: "01", title: "Create a group", text: "Add the people you're sharing expenses with." },
              { num: "02", title: "Add expenses", text: "Log receipts and pick how to split them." },
              { num: "03", title: "See balances", text: "Balancio calculates exactly who owes whom." },
              { num: "04", title: "Settle smarter", text: "Use debt simplification to pay back instantly." },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="text-3xl font-bold text-line-strong mb-4">{step.num}</div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-ink-secondary mt-2">{step.text}</p>
                {i < 3 && <div className="hidden md:block absolute top-6 left-12 right-0 h-px bg-line-subtle -z-10" />}
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative mx-auto max-w-4xl px-6 py-32 text-center">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Stop calculating.<br/>
            Start knowing.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-ink-secondary">
            Bring shared expenses, settlements and financial insights into one intelligent workspace.
          </p>
          <div className="mt-10 flex justify-center">
            <LiquidButton onClick={() => router.push("/register")} className="px-10 py-8 text-lg">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </LiquidButton>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-line-subtle bg-surface-1">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <Logo />
          </div>
          <div className="mt-8 flex justify-center gap-6 md:mt-0">
            <a href="#features" className="text-sm text-ink-muted hover:text-ink-primary transition-colors">Features</a>
            <a href="#ai" className="text-sm text-ink-muted hover:text-ink-primary transition-colors">AI</a>
            <a href="#security" className="text-sm text-ink-muted hover:text-ink-primary transition-colors">Security</a>
            <a href="#" className="text-sm text-ink-muted hover:text-ink-primary transition-colors">Privacy</a>
            <a href="#" className="text-sm text-ink-muted hover:text-ink-primary transition-colors">Terms</a>
          </div>
          <p className="mt-8 text-center text-sm text-ink-muted md:mt-0">
            &copy; 2026 Balancio. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
