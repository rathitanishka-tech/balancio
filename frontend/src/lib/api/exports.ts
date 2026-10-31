import { getExpenses } from "@/lib/actions/expenses";
import { getGroupBalances } from "@/lib/actions/balances";
import { formatMoney } from "@/lib/formatters/currency";

function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const exportsApi = {
  async downloadCsv(groupId: string, groupName: string): Promise<void> {
    const [{ items: expenses }, balances] = await Promise.all([
      getExpenses({ groupId, limit: 500 }),
      getGroupBalances(groupId),
    ]);

    const lines: string[] = [];
    lines.push(`"Balancio Group Expense Export - ${groupName.replace(/"/g, '""')}"`);
    lines.push(`"Generated At: ${new Date().toISOString()}"`);
    lines.push("");
    lines.push("Date,Title,Category,Amount,Paid By User ID");

    for (const exp of expenses) {
      const date = exp.date.split("T")[0];
      const title = `"${exp.title.replace(/"/g, '""')}"`;
      const cat = `"${exp.category.replace(/"/g, '""')}"`;
      const amt = (exp.amount / 100).toFixed(2);
      lines.push(`${date},${title},${cat},${amt},${exp.paidBy}`);
    }

    lines.push("");
    lines.push("Member Balances");
    lines.push("Member,Net Balance,Total Paid,Total Owed");

    for (const b of balances) {
      const name = `"${b.name.replace(/"/g, '""')}"`;
      const net = (b.netBalance / 100).toFixed(2);
      const paid = (b.totalPaid / 100).toFixed(2);
      const owed = (b.totalOwed / 100).toFixed(2);
      lines.push(`${name},${net},${paid},${owed}`);
    }

    const csvContent = lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const filename = `${groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-export.csv`;
    triggerDownload(blob, filename);
  },

  async downloadPdf(groupId: string, groupName: string): Promise<void> {
    const [{ items: expenses }, balances] = await Promise.all([
      getExpenses({ groupId, limit: 500 }),
      getGroupBalances(groupId),
    ]);

    const lines: string[] = [];
    lines.push(`BALANCIO FINANCIAL REPORT`);
    lines.push(`Group: ${groupName}`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push(`----------------------------------------`);
    lines.push(`\nMEMBER BALANCES:`);
    for (const b of balances) {
      lines.push(`- ${b.name}: Net ${formatMoney(b.netBalance)} (Paid: ${formatMoney(b.totalPaid)}, Owed: ${formatMoney(b.totalOwed)})`);
    }
    lines.push(`\nRECENT EXPENSES:`);
    for (const exp of expenses.slice(0, 50)) {
      lines.push(`- [${exp.date.split("T")[0]}] ${exp.title}: ${formatMoney(exp.amount)} (${exp.category})`);
    }
    lines.push(`\n----------------------------------------`);
    lines.push(`End of Report.`);

    const reportContent = lines.join("\n");
    const blob = new Blob([reportContent], { type: "text/plain;charset=utf-8;" });
    const filename = `${groupName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.txt`;
    triggerDownload(blob, filename);
  }
};
