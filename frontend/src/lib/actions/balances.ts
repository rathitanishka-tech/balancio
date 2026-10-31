"use server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "../db";
import { getOrCreateCurrentUser } from "./user";
import type { MemberBalance } from "@/types/balance";

export async function getGroupBalances(groupId: string): Promise<MemberBalance[]> {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  // Authorization check: Verify user is a member of the requested group
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: dbUser.id },
  });
  if (!membership) {
    throw new Error("Forbidden: You are not a member of this group");
  }

  // Fetch all group members to ensure even members with 0 activity are present
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  // Map to hold balance statistics for every user
  const statsMap = new Map<
    string,
    {
      userId: string;
      name: string;
      totalPaid: number;
      totalOwed: number;
      settlementsPaid: number;
      settlementsReceived: number;
    }
  >();

  for (const gm of groupMembers) {
    statsMap.set(gm.userId, {
      userId: gm.userId,
      name: gm.user.name,
      totalPaid: 0,
      totalOwed: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
    });
  }

  // Fetch expenses in the group
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: { splits: true },
  });

  for (const exp of expenses) {
    // Expense creator paid the total amount
    const creatorStats = statsMap.get(exp.creatorId);
    if (creatorStats) {
      creatorStats.totalPaid += exp.amount;
    }

    for (const split of exp.splits) {
      const splitStats = statsMap.get(split.userId);
      if (splitStats) {
        splitStats.totalOwed += split.amount;
      }
    }
  }

  // Fetch settlements in the group
  const settlements = await prisma.settlement.findMany({
    where: { groupId },
  });

  for (const settlement of settlements) {
    const fromStats = statsMap.get(settlement.fromUserId);
    if (fromStats) {
      fromStats.settlementsPaid += settlement.amount;
    }

    const toStats = statsMap.get(settlement.toUserId);
    if (toStats) {
      toStats.settlementsReceived += settlement.amount;
    }
  }

  // Calculate netBalance = (totalPaid - totalOwed) + (settlementsPaid - settlementsReceived)
  const result: MemberBalance[] = Array.from(statsMap.values()).map((s) => ({
    userId: s.userId,
    name: s.name,
    totalPaid: s.totalPaid,
    totalOwed: s.totalOwed,
    settlementsPaid: s.settlementsPaid,
    settlementsReceived: s.settlementsReceived,
    netBalance: (s.totalPaid - s.totalOwed) + (s.settlementsPaid - s.settlementsReceived),
  }));

  return result;
}
