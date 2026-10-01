"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../db";
import { getGroupBalances } from "./balances";
import { getOrCreateCurrentUser } from "./user";

export async function getSimplifiedDebts(groupId: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const balances = await getGroupBalances(groupId);

  // Separate debtors and creditors
  const debtors = balances.filter(b => b.netBalance < 0).map(b => ({ ...b, amount: Math.abs(b.netBalance) })).sort((a, b) => b.amount - a.amount);
  const creditors = balances.filter(b => b.netBalance > 0).map(b => ({ ...b, amount: b.netBalance })).sort((a, b) => b.amount - a.amount);

  const transactions: { fromUserId: string; fromUserName: string; toUserId: string; toUserName: string; amount: number }[] = [];

  let i = 0; // debtors index
  let j = 0; // creditors index

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0) {
      transactions.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.name,
        toUserId: creditor.userId,
        toUserName: creditor.name,
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
