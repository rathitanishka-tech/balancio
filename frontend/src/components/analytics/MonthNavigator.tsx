"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/formatters/date";
import { shiftMonth } from "@/lib/formatters/date";

export function MonthNavigator({
  month,
  year,
  onChange
}: {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}) {
  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  function go(delta: number) {
    const next = shiftMonth(month, year, delta);
    onChange(next.month, next.year);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={() => go(-1)} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[9rem] text-center text-sm font-medium text-ink-primary">
        {formatMonthYear(month, year)}
      </span>
      <Button variant="ghost" size="icon" onClick={() => go(1)} disabled={isCurrentMonth} aria-label="Next month">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
