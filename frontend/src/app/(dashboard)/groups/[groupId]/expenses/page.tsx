"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { ExpenseFormModal } from "@/components/expenses/ExpenseFormModal";

export default function GroupExpensesPage({ params }: { params: { groupId: string } }) {
  const [addOpen, setAddOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add expense
        </Button>
      </div>
      <ExpenseList filters={{ group: params.groupId }} onAddExpense={() => setAddOpen(true)} />
      <ExpenseFormModal open={addOpen} onOpenChange={setAddOpen} groupId={params.groupId} />
    </div>
  );
}
