"use server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "../db";
import { getOrCreateCurrentUser } from "./user";
import type { SearchResults } from "@/types/search";

export async function searchAll(query: string): Promise<SearchResults> {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();
  const q = query.trim();

  if (!q) {
    return { groups: [], expenses: [], users: [], settlements: [] };
  }

  // 1. Get user's authorized groups
  const userMemberships = await prisma.groupMember.findMany({
    where: { userId: dbUser.id },
    select: { groupId: true },
  });
  const authorizedGroupIds = userMemberships.map((m) => m.groupId);

  if (authorizedGroupIds.length === 0) {
    return { groups: [], expenses: [], users: [], settlements: [] };
  }

  // 2. Search authorized groups
  const groups = await prisma.group.findMany({
    where: {
      id: { in: authorizedGroupIds },
      name: { contains: q, mode: "insensitive" },
    },
    take: 10,
  });

  // 3. Search authorized expenses
  const expenses = await prisma.expense.findMany({
    where: {
      groupId: { in: authorizedGroupIds },
      title: { contains: q, mode: "insensitive" },
    },
    take: 10,
    orderBy: { date: "desc" },
  });

  // 4. Search fellow group members
  const fellowMembers = await prisma.groupMember.findMany({
    where: {
      groupId: { in: authorizedGroupIds },
    },
    select: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const matchingUsersMap = new Map<string, { id: string; name: string; email: string }>();
  const lowerQ = q.toLowerCase();
  for (const gm of fellowMembers) {
    if (
      gm.user.name.toLowerCase().includes(lowerQ) ||
      gm.user.email.toLowerCase().includes(lowerQ)
    ) {
      matchingUsersMap.set(gm.user.id, gm.user);
    }
  }

  // 5. Search settlements
  const settlements = await prisma.settlement.findMany({
    where: {
      groupId: { in: authorizedGroupIds },
      note: { contains: q, mode: "insensitive" },
    },
    take: 10,
    orderBy: { date: "desc" },
  });

  return {
    groups: groups.map((g) => ({ id: g.id, name: g.name })),
    expenses: expenses.map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      groupId: e.groupId || "",
      date: e.date.toISOString(),
    })),
    users: Array.from(matchingUsersMap.values()).slice(0, 10),
    settlements: settlements.map((s) => ({
      id: s.id,
      amount: s.amount,
      groupId: s.groupId,
      note: s.note || undefined,
      date: s.date.toISOString(),
    })),
  };
}

