"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SearchDialog } from "@/components/search/SearchDialog";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/layout/Logo";

/**
 * Every route under (dashboard) requires authentication - this is where
 * that's enforced (spec section 76: unauthenticated visitors to /dashboard
 * etc. are redirected to /login). It also wires up the global Ctrl+K
 * search dialog and the mobile "+" quick-add-expense flow in exactly one
 * place instead of duplicating them per page.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);

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
        <Navbar onOpenSearch={() => setSearchOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 lg:pb-10">{children}</main>
      </div>

      <MobileBottomNav onAddExpense={() => setQuickAddOpen(true)} />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      {quickAddOpen && <ExpenseFormModal open={quickAddOpen} onOpenChange={setQuickAddOpen} />}
    </div>
  );
}
