"use server";

import { getSession, requireAuth } from "@/lib/auth/session";
import { prisma } from "../db";
import { getOrCreateCurrentUser } from "./user";

const EMPTY_OVERVIEW = {
  groupCount: 0,
  expenseCount: 0,
  totalSpending: 0,
  userShare: 0,
  totalPaid: 0,
  totalOwed: 0,
  netBalance: 0,
};

export async function getAnalyticsOverview() {
  const session = await getSession();
  if (!session?.userId) return EMPTY_OVERVIEW;

  const dbUser = await getOrCreateCurrentUser();
  if (!dbUser) return EMPTY_OVERVIEW;

  try {
    const memberships = await prisma.groupMember.count({ where: { userId: dbUser.id } });
    
    const userExpenses = await prisma.expense.findMany({
      where: {
        OR: [
          { creatorId: dbUser.id },
          { splits: { some: { userId: dbUser.id } } },
        ],
      },
      include: { splits: true },
    });

    const expenseCount = userExpenses.length;
    
    let totalSpending = 0;
    let userShare = 0;
    let totalPaid = 0;
    let totalOwed = 0;

    for (const exp of userExpenses) {
      const isCreator = exp.creatorId === dbUser.id;
      if (isCreator) {
        totalSpending += exp.amount;
        totalPaid += exp.amount;
      }

      const mySplit = exp.splits.find((s) => s.userId === dbUser.id);
      if (mySplit) {
        userShare += mySplit.amount;
        if (!isCreator) {
          totalOwed += mySplit.amount - mySplit.paid;
        }
      }
    }

    const netBalance = totalPaid - userShare;

    return {
      groupCount: memberships,
      expenseCount,
      totalSpending,
      userShare,
      totalPaid,
      totalOwed,
      netBalance,
    };
  } catch (err: any) {
    console.error("[GET_ANALYTICS_OVERVIEW_DB_ERROR]", err?.message || err);
    return EMPTY_OVERVIEW;
  }
}

export async function getAnalyticsTrends(groupId?: string, months = 6) {
  const session = await getSession();
  if (!session?.userId) return [];

  const dbUser = await getOrCreateCurrentUser();
  if (!dbUser) return [];

  try {
    const minDate = new Date();
    minDate.setMonth(minDate.getMonth() - months);

    const whereCondition: any = {
      date: {
        gte: minDate,
      },
    };
    
    if (groupId) {
      whereCondition.groupId = groupId;
    }

    const userExpenses = await prisma.expense.findMany({
      where: {
        ...whereCondition,
        OR: [
          { creatorId: dbUser.id },
          { splits: { some: { userId: dbUser.id } } },
        ],
      },
      include: { splits: true },
    });

    const trendMap = new Map<string, { totalSpending: number; userShare: number }>();
    
    for (const exp of userExpenses) {
      const month = exp.date.getMonth() + 1; // 1-12
      const year = exp.date.getFullYear();
      const monthStr = String(month).padStart(2, "0");
      const key = `${year}-${monthStr}`;
      
      if (!trendMap.has(key)) {
        trendMap.set(key, { totalSpending: 0, userShare: 0 });
      }
      
      const entry = trendMap.get(key)!;
      const mySplit = exp.splits.find((s) => s.userId === dbUser.id);
      if (mySplit) {
        entry.userShare += mySplit.amount;
      }
      if (exp.creatorId === dbUser.id) {
        entry.totalSpending += exp.amount;
      }
    }

    const result = Array.from(trendMap.entries()).map(([key, data]) => {
      return {
        month: key, // "YYYY-MM" format per TrendPoint interface
        totalSpending: data.totalSpending,
        userShare: data.userShare,
      };
    });

    return result.sort((a, b) => a.month.localeCompare(b.month));
  } catch (err: any) {
    console.error("[GET_ANALYTICS_TRENDS_DB_ERROR]", err?.message || err);
    return [];
  }
}
