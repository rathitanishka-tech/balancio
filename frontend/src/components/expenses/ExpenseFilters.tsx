"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlassSelect } from "@/components/glass";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useGroups } from "@/hooks/useGroups";
import { EXPENSE_CATEGORIES } from "@/types/expense";
import { X } from "lucide-react";

export function ExpenseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: groups } = useGroups();

  const group = searchParams.get("group") ?? "";
  const category = searchParams.get("category") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/expenses?${params.toString()}`);
  }

  const hasFilters = group || category || dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <GlassSelect
        containerClassName="w-40"
        placeholder="All groups"
        value={group}
        onValueChange={(v) => updateParam("group", v)}
        options={(groups ?? []).map((g) => ({ value: g.id, label: g.name }))}
      />
      <GlassSelect
        containerClassName="w-40"
        placeholder="All categories"
        value={category}
        onValueChange={(v) => updateParam("category", v)}
        options={EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dateFrom" className="text-[#556477] dark:text-[#AAB6C8] text-sm font-medium">From</Label>
        <Input
          id="dateFrom"
          type="date"
          value={dateFrom}
          onChange={(e) => updateParam("dateFrom", e.target.value)}
          className="w-40 border-[#DCE3ED] dark:border-[#26354B] bg-[#F4F6FA] dark:bg-[#111B2B] text-[#172033] dark:text-[#E8EDF6]"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dateTo" className="text-[#556477] dark:text-[#AAB6C8] text-sm font-medium">To</Label>
        <Input
          id="dateTo"
          type="date"
          value={dateTo}
          onChange={(e) => updateParam("dateTo", e.target.value)}
          className="w-40 border-[#DCE3ED] dark:border-[#26354B] bg-[#F4F6FA] dark:bg-[#111B2B] text-[#172033] dark:text-[#E8EDF6]"
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/expenses")}>
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}

