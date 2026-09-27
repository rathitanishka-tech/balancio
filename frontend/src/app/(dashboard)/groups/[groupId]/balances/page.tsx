"use client";

import * as React from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BalanceOverview } from "@/components/balances/BalanceOverview";
import { SimplifyDebtsPanel } from "@/components/debts/SimplifyDebtsPanel";
import { useGroup } from "@/hooks/useGroups";
import { exportsApi } from "@/lib/api/exports";
import { toast } from "sonner";
import { ApiError, friendlyErrorMessage } from "@/lib/api/errors";

export default function GroupBalancesPage({ params }: { params: { groupId: string } }) {
  const { groupId } = params;
  const { data: group } = useGroup(groupId);
  const [exporting, setExporting] = React.useState<"csv" | "pdf" | null>(null);

  async function handleExport(kind: "csv" | "pdf") {
    if (!group) return;
    setExporting(kind);
    try {
      if (kind === "csv") await exportsApi.downloadCsv(groupId, group.name);
      else await exportsApi.downloadPdf(groupId, group.name);
      toast.success("Export generated");
    } catch (err) {
      const message = err instanceof ApiError ? friendlyErrorMessage(err) : "Couldn't generate that export.";
      toast.error(message);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={() => handleExport("csv")} loading={exporting === "csv"}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
        <Button variant="secondary" size="sm" onClick={() => handleExport("pdf")} loading={exporting === "pdf"}>
          <FileText className="h-3.5 w-3.5" />
          Export PDF
        </Button>
      </div>

      <BalanceOverview groupId={groupId} />
      <SimplifyDebtsPanel groupId={groupId} />
    </div>
  );
}
