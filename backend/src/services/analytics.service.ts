import { Types } from "mongoose";
import { Expense } from "../models/Expense";
import { ExpenseParticipant } from "../models/ExpenseParticipant";
import { groupRepository } from "../repositories/group.repository";
import { assertGroupRole } from "../middleware/role.middleware";
import { startOfMonth, startOfNextMonth, monthKey } from "../utils/dates";
import { ValidationError } from "../utils/errors";

/**
 * All figures are computed live from MongoDB (Expense/ExpenseParticipant
 * documents) - nothing here is fabricated or hardcoded. For very large
 * datasets these reduce()-based aggregations would be better expressed as
 * MongoDB aggregation pipelines ($group/$lookup); they are kept as
 * straightforward query + in-memory reduction here for clarity and because
 * a typical expense-sharing group's data volume does not require it.
 */

async function resolveGroupScope(userId: string, groupId?: string): Promise<string[]> {
  if (groupId) {
    await assertGroupRole(groupId, userId, ["OWNER", "ADMIN", "MEMBER"]);
    return [groupId];
  }
  const memberships = await groupRepository.listGroupsForUser(userId);
  return memberships.map((m) => m.groupId.toString());
}

interface DateRange {
  from?: Date;
  to?: Date;
}

async function fetchExpensesInScope(groupIds: string[], range?: DateRange) {
  if (groupIds.length === 0) return [];
  const query: Record<string, unknown> = { groupId: { $in: groupIds }, deletedAt: null };
  if (range?.from || range?.to) {
    const dateFilter: Record<string, Date> = {};
    if (range.from) dateFilter.$gte = range.from;
    if (range.to) dateFilter.$lt = range.to;
    query.date = dateFilter;
  }
  return Expense.find(query).select("_id groupId amount category date paidBy");
}

async function fetchParticipantSharesForUser(expenseIds: Types.ObjectId[], userId: string) {
  const rows = await ExpenseParticipant.find({
    expenseId: { $in: expenseIds },
    userId
  }).select("expenseId shareAmount");
  return new Map(rows.map((r) => [r.expenseId.toString(), r.shareAmount]));
}

export const analyticsService = {
  async getOverview(userId: string) {
    const groupIds = await resolveGroupScope(userId);
    const expenses = await fetchExpensesInScope(groupIds);
    const expenseIds = expenses.map((e) => e._id);
    const shareMap = await fetchParticipantSharesForUser(expenseIds, userId);

    let totalSpending = 0;
    let totalPaid = 0;
    let totalOwed = 0;

    for (const e of expenses) {
      totalSpending += e.amount;
      if (e.paidBy.toString() === userId) totalPaid += e.amount;
      totalOwed += shareMap.get(e._id.toString()) ?? 0;
    }

    return {
      groupCount: groupIds.length,
      expenseCount: expenses.length,
      totalSpending,
      userShare: totalOwed,
      totalPaid,
      totalOwed,
      netBalance: totalPaid - totalOwed
    };
  },

  async getMonthly(userId: string, month: number, year: number, groupId?: string) {
    if (month < 1 || month > 12) {
      throw new ValidationError("month must be between 1 and 12");
    }
    const groupIds = await resolveGroupScope(userId, groupId);
    const from = startOfMonth(year, month);
    const to = startOfNextMonth(year, month);

    const expenses = await fetchExpensesInScope(groupIds, { from, to });
    const expenseIds = expenses.map((e) => e._id);
    const shareMap = await fetchParticipantSharesForUser(expenseIds, userId);

    let totalSpending = 0;
    let totalPaid = 0;
    let totalOwed = 0;

    for (const e of expenses) {
      totalSpending += e.amount;
      if (e.paidBy.toString() === userId) totalPaid += e.amount;
      totalOwed += shareMap.get(e._id.toString()) ?? 0;
    }

    return { month, year, totalSpending, userShare: totalOwed, totalPaid, totalOwed };
  },

  async getCategories(userId: string, groupId?: string) {
    const groupIds = await resolveGroupScope(userId, groupId);
    const expenses = await fetchExpensesInScope(groupIds);
    const expenseIds = expenses.map((e) => e._id);
    const shareMap = await fetchParticipantSharesForUser(expenseIds, userId);

    const byCategory = new Map<string, { totalSpending: number; userShare: number; count: number }>();
    for (const e of expenses) {
      const entry = byCategory.get(e.category) ?? { totalSpending: 0, userShare: 0, count: 0 };
      entry.totalSpending += e.amount;
      entry.userShare += shareMap.get(e._id.toString()) ?? 0;
      entry.count += 1;
      byCategory.set(e.category, entry);
    }

    return Array.from(byCategory.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.totalSpending - a.totalSpending);
  },

  async getGroupsBreakdown(userId: string) {
    const memberships = await groupRepository.listGroupsForUser(userId);
    const groupIds = memberships.map((m) => m.groupId.toString());
    const groups = await Promise.all(groupIds.map((id) => groupRepository.findById(id)));

    const results = [];
    for (const group of groups) {
      if (!group) continue;
      const expenses = await fetchExpensesInScope([group._id.toString()]);
      const expenseIds = expenses.map((e) => e._id);
      const shareMap = await fetchParticipantSharesForUser(expenseIds, userId);

      let totalSpending = 0;
      let userShare = 0;
      let totalPaid = 0;
      for (const e of expenses) {
        totalSpending += e.amount;
        userShare += shareMap.get(e._id.toString()) ?? 0;
        if (e.paidBy.toString() === userId) totalPaid += e.amount;
      }

      results.push({
        groupId: group._id.toString(),
        name: group.name,
        totalSpending,
        userShare,
        totalPaid,
        expenseCount: expenses.length
      });
    }

    return results.sort((a, b) => b.totalSpending - a.totalSpending);
  },

  async getTrends(userId: string, groupId?: string, months = 6) {
    const groupIds = await resolveGroupScope(userId, groupId);

    const now = new Date();
    const from = startOfMonth(now.getUTCFullYear(), now.getUTCMonth() + 1 - (months - 1));
    const expenses = await fetchExpensesInScope(groupIds, { from });
    const expenseIds = expenses.map((e) => e._id);
    const shareMap = await fetchParticipantSharesForUser(expenseIds, userId);

    const byMonth = new Map<string, { totalSpending: number; userShare: number }>();
    for (const e of expenses) {
      const key = monthKey(e.date);
      const entry = byMonth.get(key) ?? { totalSpending: 0, userShare: 0 };
      entry.totalSpending += e.amount;
      entry.userShare += shareMap.get(e._id.toString()) ?? 0;
      byMonth.set(key, entry);
    }

    // Ensure every month in the requested window is present, even with zero spending.
    const result: { month: string; totalSpending: number; userShare: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = monthKey(d);
      const entry = byMonth.get(key) ?? { totalSpending: 0, userShare: 0 };
      result.push({ month: key, ...entry });
    }

    return result;
  }
};
