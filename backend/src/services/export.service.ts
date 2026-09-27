import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import { Expense } from "../models/Expense";
import { ExpenseParticipant } from "../models/ExpenseParticipant";
import { Settlement } from "../models/Settlement";
import { groupRepository } from "../repositories/group.repository";
import { userRepository } from "../repositories/user.repository";
import { assertGroupRole } from "../middleware/role.middleware";
import { NotFoundError } from "../utils/errors";
import { fromMinorUnits, formatMoney } from "../utils/currency";
import { calculateGroupBalances } from "./balance.service";

function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function buildExportData(groupId: string, requestingUserId: string) {
  const group = await groupRepository.findById(groupId);
  if (!group) throw new NotFoundError("Group");
  await assertGroupRole(groupId, requestingUserId, ["OWNER", "ADMIN", "MEMBER"]);

  const expenses = await Expense.find({ groupId, deletedAt: null }).sort({ date: 1 });
  const expenseIds = expenses.map((e) => e._id);
  const participants = await ExpenseParticipant.find({ expenseId: { $in: expenseIds } });
  const settlements = await Settlement.find({ groupId }).sort({ date: 1 });

  const memberIds = new Set<string>();
  expenses.forEach((e) => memberIds.add(e.paidBy.toString()));
  participants.forEach((p) => memberIds.add(p.userId.toString()));
  settlements.forEach((s) => {
    memberIds.add(s.fromUser.toString());
    memberIds.add(s.toUser.toString());
  });

  const users = await userRepository.findByIds(Array.from(memberIds));
  const nameMap = new Map(users.map((u) => [u._id.toString(), u.name]));

  const participantsByExpense = new Map<string, typeof participants>();
  for (const p of participants) {
    const key = p.expenseId.toString();
    const arr = participantsByExpense.get(key) ?? [];
    arr.push(p);
    participantsByExpense.set(key, arr);
  }

  const balances = await calculateGroupBalances(groupId, requestingUserId);

  return { group, expenses, participantsByExpense, settlements, nameMap, balances };
}

export const exportService = {
  async exportGroupCsv(groupId: string, requestingUserId: string): Promise<{ filename: string; content: string }> {
    const { group, expenses, participantsByExpense, nameMap } = await buildExportData(
      groupId,
      requestingUserId
    );

    const header = [
      "Date",
      "Expense",
      "Category",
      "Paid By",
      "Participants",
      "Amount",
      "User Share",
      "Balance"
    ];

    const rows: string[] = [header.map(csvEscape).join(",")];

    for (const expense of expenses) {
      const shares = participantsByExpense.get(expense._id.toString()) ?? [];
      const payerName = nameMap.get(expense.paidBy.toString()) ?? "Unknown";
      const participantNames = shares
        .map((s) => nameMap.get(s.userId.toString()) ?? "Unknown")
        .join("; ");

      const userShareEntry = shares.find((s) => s.userId.toString() === requestingUserId);
      const userShare = userShareEntry?.shareAmount ?? 0;
      const isPayer = expense.paidBy.toString() === requestingUserId;
      // Per-expense net effect for the requesting user: positive means
      // this expense left them owed money, negative means they owe.
      const rowBalance = isPayer ? expense.amount - userShare : -userShare;

      rows.push(
        [
          expense.date.toISOString().slice(0, 10),
          expense.title,
          expense.category,
          payerName,
          participantNames,
          fromMinorUnits(expense.amount).toFixed(2),
          fromMinorUnits(userShare).toFixed(2),
          fromMinorUnits(rowBalance).toFixed(2)
        ]
          .map(csvEscape)
          .join(",")
      );
    }

    return { filename: `${sanitizeFilename(group.name)}-expenses.csv`, content: rows.join("\n") };
  },

  async exportGroupPdf(groupId: string, requestingUserId: string): Promise<{ filename: string; stream: PassThrough }> {
    const { group, expenses, participantsByExpense, settlements, nameMap, balances } =
      await buildExportData(groupId, requestingUserId);

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const stream = new PassThrough();
    doc.pipe(stream);

    const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
    const dates = expenses.map((e) => e.date.getTime());
    const dateRange =
      dates.length > 0
        ? `${new Date(Math.min(...dates)).toDateString()} - ${new Date(Math.max(...dates)).toDateString()}`
        : "No expenses recorded";

    // --- Header ---------------------------------------------------------
    doc.fontSize(20).text(`${group.name} - Expense Report`, { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#555").text(`Date range: ${dateRange}`);
    doc.text(`Generated: ${new Date().toDateString()}`);
    doc.fillColor("#000");
    doc.moveDown();

    doc.fontSize(14).text("Summary");
    doc.fontSize(11).text(`Total spending: ${formatMoney(totalSpending, group.currency)}`);
    doc.text(`Total expenses: ${expenses.length}`);
    doc.text(`Total settlements: ${settlements.length}`);
    doc.moveDown();

    // --- Member balances --------------------------------------------------
    doc.fontSize(14).text("Member Balances");
    doc.fontSize(10);
    for (const b of balances) {
      const status = b.netBalance > 0 ? "is owed" : b.netBalance < 0 ? "owes" : "is settled up";
      doc.text(
        `${b.name}: ${status} ${formatMoney(Math.abs(b.netBalance), group.currency)} (paid ${formatMoney(
          b.totalPaid,
          group.currency
        )}, share ${formatMoney(b.totalOwed, group.currency)})`
      );
    }
    doc.moveDown();

    // --- Expense history --------------------------------------------------
    doc.fontSize(14).text("Expense History");
    doc.fontSize(9);
    for (const expense of expenses) {
      const payerName = nameMap.get(expense.paidBy.toString()) ?? "Unknown";
      const shares = participantsByExpense.get(expense._id.toString()) ?? [];
      const participantNames = shares.map((s) => nameMap.get(s.userId.toString()) ?? "Unknown").join(", ");
      doc.text(
        `${expense.date.toISOString().slice(0, 10)}  ${expense.title} [${expense.category}]  ` +
          `${formatMoney(expense.amount, expense.currency)} paid by ${payerName}  -  split: ${participantNames}`
      );
    }
    doc.moveDown();

    // --- Settlement history --------------------------------------------------
    doc.fontSize(14).text("Settlement History");
    doc.fontSize(9);
    if (settlements.length === 0) {
      doc.text("No settlements recorded.");
    }
    for (const s of settlements) {
      const fromName = nameMap.get(s.fromUser.toString()) ?? "Unknown";
      const toName = nameMap.get(s.toUser.toString()) ?? "Unknown";
      doc.text(
        `${s.date.toISOString().slice(0, 10)}  ${fromName} paid ${toName} ${formatMoney(
          s.amount,
          s.currency
        )} via ${s.paymentMethod}`
      );
    }

    doc.end();

    return { filename: `${sanitizeFilename(group.name)}-report.pdf`, stream };
  }
};

function sanitizeFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "group";
}
