"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../db";
import { getOrCreateCurrentUser } from "./user";

export async function getAnalyticsOverview() {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const memberships = await prisma.groupMember.count({ where: { userId: dbUser.id } });
  
  const userSplits = await prisma.split.findMany({
    where: { userId: dbUser.id },
    include: { expense: true },
  });

  const expenseCount = new Set(userSplits.map(s => s.expenseId)).size;
  
  let totalSpending = 0;
  let userShare = 0;
  let totalPaid = 0;
  let totalOwed = 0; // The amount other users owe me (Wait, no, totalOwed usually means what I owe)

  for (const split of userSplits) {
    if (split.expense.creatorId === dbUser.id) {
      totalSpending += split.expense.amount;
      totalPaid += split.expense.amount;
      userShare += split.amount;
      // if I paid, I owe nothing, others owe me: expense.amount - my share
    } else {
      userShare += split.amount;
      totalOwed += split.amount - split.paid;
    }
  }

  // Calculate actual totalOwed (what I owe) and netBalance (totalPaid - userShare)
  const netBalance = totalPaid - userShare;

  return {
    groupCount: memberships,
    expenseCount,
    totalSpending, // Total volume of expenses user is involved in
    userShare,
    totalPaid,
    totalOwed,
    netBalance,
  };
}

export async function getAnalyticsTrends(groupId?: string, months = 6) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const whereCondition: any = {
    date: {
      gte: new Date(new Date().setMonth(new Date().getMonth() - months)),
    },
  };
  
  if (groupId) {
    whereCondition.groupId = groupId;
  }

  const userSplits = await prisma.split.findMany({
    where: { 
      userId: dbUser.id,
      expense: whereCondition,
    },
    include: { expense: true },
  });

  const trendMap = new Map<string, { totalSpending: number, userShare: number }>();
  
  for (const split of userSplits) {
    const month = split.expense.date.getMonth() + 1; // 1-12
    const year = split.expense.date.getFullYear();
    const key = `${year}-${month}`;
    
    if (!trendMap.has(key)) {
      trendMap.set(key, { totalSpending: 0, userShare: 0 });
    }
    
    const entry = trendMap.get(key)!;
    entry.userShare += split.amount;
    if (split.expense.creatorId === dbUser.id) {
       // Only add to total spending if the user is involved and it was created by them?
       // Let's add the total volume to totalSpending
       entry.totalSpending += split.expense.amount;
    }
  }

  const result = Array.from(trendMap.entries()).map(([key, data]) => {
    const [yearStr, monthStr] = key.split('-');
    return {
      month: parseInt(monthStr),
      year: parseInt(yearStr),
      totalSpending: data.totalSpending,
      userShare: data.userShare,
    };
  });

  return result.sort((a, b) => {
    if (a.year === b.year) return a.month - b.month;
    return a.year - b.year;
  });
}
