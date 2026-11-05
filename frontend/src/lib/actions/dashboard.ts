"use server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "../db";
import { getOrCreateCurrentUser } from "./user";
import { getAnalyticsOverview } from "./analytics";

export interface DashboardSummaryData {
  youOwe: number;
  youAreOwed: number;
  totalSpending: number;
  groupCount: number;
}

export async function getDashboardOverview() {
  return await getAnalyticsOverview();
}

/**
 * Consolidated high-performance server action that retrieves all dashboard
 * metrics (youOwe, youAreOwed, totalSpending, groupCount) in a single parallel
 * query batch instead of an N+2 waterfall from the browser.
 */
export async function getDashboardSummary(): Promise<DashboardSummaryData> {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const user = await getOrCreateCurrentUser();

  try {
    // 1. Fetch authorized group IDs
    const memberships = await prisma.groupMember.findMany({
      where: { userId: user.id },
      select: { groupId: true }
    });
    const authorizedGroupIds = memberships.map((m) => m.groupId);

    // 2. Fetch all group expenses, settlements, and personal spending concurrently
    const [allGroupExpenses, allGroupSettlements, spendingAgg] = await Promise.all([
      authorizedGroupIds.length > 0
        ? prisma.expense.findMany({
            where: { groupId: { in: authorizedGroupIds } },
            select: {
              groupId: true,
              creatorId: true,
              amount: true,
              splits: { select: { userId: true, amount: true } }
            }
          })
        : [],
      authorizedGroupIds.length > 0
        ? prisma.settlement.findMany({
            where: {
              groupId: { in: authorizedGroupIds },
              OR: [{ fromUserId: user.id }, { toUserId: user.id }]
            },
            select: { groupId: true, fromUserId: true, toUserId: true, amount: true }
          })
        : [],
      prisma.expense.aggregate({
        where: { creatorId: user.id },
        _sum: { amount: true }
      })
    ]);

    // 3. Compute per-group balances in memory
    const groupBalanceMap = new Map<
      string,
      { totalPaid: number; totalOwed: number; settlementsPaid: number; settlementsReceived: number }
    >();

    for (const gid of authorizedGroupIds) {
      groupBalanceMap.set(gid, {
        totalPaid: 0,
        totalOwed: 0,
        settlementsPaid: 0,
        settlementsReceived: 0
      });
    }

    for (const exp of allGroupExpenses) {
      if (!exp.groupId) continue;
      const stats = groupBalanceMap.get(exp.groupId);
      if (!stats) continue;

      if (exp.creatorId === user.id) {
        stats.totalPaid += exp.amount;
      }
      for (const sp of exp.splits) {
        if (sp.userId === user.id) {
          stats.totalOwed += sp.amount;
        }
      }
    }

    for (const set of allGroupSettlements) {
      const stats = groupBalanceMap.get(set.groupId);
      if (!stats) continue;
      if (set.fromUserId === user.id) stats.settlementsPaid += set.amount;
      if (set.toUserId === user.id) stats.settlementsReceived += set.amount;
    }

    let youOwe = 0;
    let youAreOwed = 0;

    for (const stats of groupBalanceMap.values()) {
      const net = stats.totalPaid - stats.totalOwed + (stats.settlementsPaid - stats.settlementsReceived);
      if (net > 0) youAreOwed += net;
      else if (net < 0) youOwe += Math.abs(net);
    }

    const totalSpending = spendingAgg._sum.amount ?? 0;

    return {
      youOwe,
      youAreOwed,
      totalSpending,
      groupCount: authorizedGroupIds.length
    };
  } catch (err: any) {
    console.error("[GET_DASHBOARD_SUMMARY_ERROR]", err?.message || err);
    return {
      youOwe: 0,
      youAreOwed: 0,
      totalSpending: 0,
      groupCount: 0
    };
  }
}
