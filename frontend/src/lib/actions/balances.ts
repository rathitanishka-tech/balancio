"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../db";

import { getOrCreateCurrentUser } from "./user";

export async function getGroupBalances(groupId: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  // Calculate balances (who paid what vs who owes what)
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: { splits: true },
  });

  const balances = new Map<string, number>();

  for (const exp of expenses) {
    // Creator is owed the total amount minus their own split
    const total = exp.amount;
    
    // Add amount to creator's positive balance
    balances.set(exp.creatorId, (balances.get(exp.creatorId) || 0) + total);

    for (const split of exp.splits) {
      // Subtract what each user owes from their balance
      balances.set(split.userId, (balances.get(split.userId) || 0) - split.amount);
    }
  }

  // Calculate balances from settlements
  const settlements = await prisma.settlement.findMany({
    where: { groupId },
  });

  for (const settlement of settlements) {
    // The payer's balance increases (they owed money, now they've paid it)
    balances.set(settlement.fromUserId, (balances.get(settlement.fromUserId) || 0) + settlement.amount);
    
    // The payee's balance decreases (they were owed money, now they received it)
    balances.set(settlement.toUserId, (balances.get(settlement.toUserId) || 0) - settlement.amount);
  }

  // Fetch names for the users
  const userIds = Array.from(balances.keys());
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
  });

  const result = users.map((u) => ({
    userId: u.id,
    name: u.name,
    netBalance: balances.get(u.id) || 0,
  }));

  return result;
}
