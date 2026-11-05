"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/layout/Logo";

// Lazy-load all overlay dialogs and modals to keep initial bundle size lean
const SearchDialog = dynamic(
  () => import("@/components/search/SearchDialog").then((m) => m.SearchDialog),
  { ssr: false }
);

const ExpenseFormModal = dynamic(
  () => import("@/components/expenses/ExpenseFormModal").then((m) => m.ExpenseFormModal),
  { ssr: false }
);

const AiChatModal = dynamic(
  () => import("@/components/ai/AiChatModal").then((m) => m.AiChatModal),
  { ssr: false }
);

/**
 * Every route under (dashboard) requires authentication - this is where
 * that's enforced. It also wires up the global Ctrl+K search dialog,
 * mobile "+" quick-add-expense flow, and AI assistant dialog in one place.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg-base">
        <div className="flex flex-col items-center gap-3">
          <Logo markOnly className="animate-pulse-soft" />
          <p className="text-sm text-ink-muted">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // redirect effect above is already in flight
  }

  return (
    <div className="flex min-h-screen bg-bg-base bg-noise">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenSearch={() => setSearchOpen(true)} onOpenAi={() => setAiOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">{children}</main>
      </div>

      <MobileBottomNav onAddExpense={() => setQuickAddOpen(true)} />
      {searchOpen && <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />}
      {quickAddOpen && <ExpenseFormModal open={quickAddOpen} onOpenChange={setQuickAddOpen} />}
      {aiOpen && <AiChatModal open={aiOpen} onOpenChange={setAiOpen} />}
    </div>
  );
}
