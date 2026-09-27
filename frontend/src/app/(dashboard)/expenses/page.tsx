"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { ExpenseFilters } from "@/components/expenses/ExpenseFilters";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";
import { LoadingSkeleton } from "@/components/common";

function ExpensesPageContent() {
  const searchParams = useSearchParams();
  const [addOpen, setAddOpen] = React.useState(false);

  const filters = {
    group: searchParams.get("group") || undefined,
    category: searchParams.get("category") || undefined,
    dateFrom: searchParams.get("dateFrom") || undefined,
    dateTo: searchParams.get("dateTo") || undefined
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Expenses"
        description="Every expense across every group you're part of."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add expense
          </Button>
        }
      />
      <ExpenseFilters />
      <ExpenseList filters={filters} onAddExpense={() => setAddOpen(true)} />
      <ExpenseFormModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton count={6} />}>
      <ExpensesPageContent />
    </Suspense>
  );
}
