"use server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "../db";
import { getGroupBalances } from "./balances";
import { getOrCreateCurrentUser } from "./user";
import type { DirectDebt, SimplifiedDebtsResult } from "@/types/debt";

export async function getDirectDebts(groupId: string): Promise<DirectDebt[]> {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  // Authorization check: Verify user is a member of the group
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: dbUser.id },
  });
  if (!membership) {
    throw new Error("Forbidden: You are not a member of this group");
  }

  const [expenses, settlements] = await Promise.all([
    prisma.expense.findMany({
      where: { groupId },
      include: { splits: true },
    }),
    prisma.settlement.findMany({
      where: { groupId },
    }),
  ]);

  // Track pairwise net obligations: key is `${minId}:${maxId}`
  // Positive value means maxId owes minId; negative value means minId owes maxId.
  const pairMap = new Map<string, number>();

  function adjustPair(creditorId: string, debtorId: string, amount: number) {
    if (creditorId === debtorId || amount === 0) return;
    const isMinCreditor = creditorId < debtorId;
    const key = isMinCreditor ? `${creditorId}:${debtorId}` : `${debtorId}:${creditorId}`;
    const delta = isMinCreditor ? amount : -amount;
    pairMap.set(key, (pairMap.get(key) || 0) + delta);
  }

  // Expenses: debtor owes creditor (creatorId)
  for (const exp of expenses) {
    for (const split of exp.splits) {
      if (split.userId !== exp.creatorId) {
        adjustPair(exp.creatorId, split.userId, split.amount);
      }
    }
  }

  // Settlements: fromUserId paid toUserId, so fromUserId's debt to toUserId is reduced
  for (const settlement of settlements) {
    adjustPair(settlement.fromUserId, settlement.toUserId, settlement.amount);
  }

  const directDebts: DirectDebt[] = [];

  for (const [key, net] of pairMap.entries()) {
    const roundedNet = Math.round(net);
    if (Math.abs(roundedNet) === 0) continue;

    const [idA, idB] = key.split(":");
    if (roundedNet > 0) {
      // idB owes idA
      directDebts.push({ from: idB, to: idA, amount: roundedNet });
    } else {
      // idA owes idB
      directDebts.push({ from: idA, to: idB, amount: Math.abs(roundedNet) });
    }
  }

  return directDebts;
}

export async function getSimplifiedDebts(groupId: string): Promise<SimplifiedDebtsResult> {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const balances = await getGroupBalances(groupId);

  // Separate debtors and creditors
  const debtors = balances
    .filter((b) => b.netBalance < 0)
    .map((b) => ({ ...b, amount: Math.abs(b.netBalance) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((b) => b.netBalance > 0)
    .map((b) => ({ ...b, amount: b.netBalance }))
    .sort((a, b) => b.amount - a.amount);

  const transactions: {
    from: { id: string; name: string };
    to: { id: string; name: string };
    amount: number;
  }[] = [];

  let i = 0; // debtors index
  let j = 0; // creditors index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      transactions.push({
        from: {
          id: debtor.userId,
          name: debtor.name,
        },
        to: {
          id: creditor.userId,
          name: creditor.name,
        },
        amount: Math.round(amount),
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return {
    transactions,
    transactionCount: transactions.length,
  };
}
