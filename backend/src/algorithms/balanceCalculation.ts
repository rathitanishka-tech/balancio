import { MemberBalance, RawBalance } from "../types/balance.types";

/**
 * Pure, DB-free balance engine. All amounts are integer minor currency
 * units. The service layer (balance.service.ts) is responsible for
 * fetching expenses/participants/settlements from MongoDB and reducing
 * them into the `MemberAggregate` shape this module expects - this file
 * never touches the database, which keeps it trivially unit-testable.
 *
 * ---------------------------------------------------------------------
 * NET BALANCE FORMULA - sign convention note
 * ---------------------------------------------------------------------
 * netBalance = totalPaid - totalOwed + settlementsPaid - settlementsReceived
 *
 * Intuition:
 *  - totalPaid - totalOwed  => raw balance purely from expenses. Positive
 *    means the user fronted more money than their own share (the group
 *    owes them); negative means they consumed more than they paid for
 *    (they owe the group).
 *  - settlementsPaid (money this user sent to settle a debt) REDUCES how
 *    much they owe, i.e. it must INCREASE netBalance (push it towards 0
 *    or positive).
 *  - settlementsReceived (money this user was paid back) REDUCES how much
 *    they are owed, i.e. it must DECREASE netBalance.
 *
 * A settlement must always move both parties' balances towards zero -
 * never away from it - otherwise "settling up" would make debts worse.
 * This is verified by tests in tests/algorithms/balanceCalculation.test.ts.
 */

export interface MemberAggregate {
  userId: string;
  name: string;
  totalPaid: number;
  totalOwed: number;
  settlementsPaid: number;
  settlementsReceived: number;
}

export function computeMemberBalances(members: MemberAggregate[]): MemberBalance[] {
  return members.map((m) => ({
    userId: m.userId,
    name: m.name,
    totalPaid: m.totalPaid,
    totalOwed: m.totalOwed,
    settlementsPaid: m.settlementsPaid,
    settlementsReceived: m.settlementsReceived,
    netBalance: m.totalPaid - m.totalOwed + m.settlementsPaid - m.settlementsReceived
  }));
}

export function toRawBalances(balances: MemberBalance[]): RawBalance[] {
  return balances.map((b) => ({ userId: b.userId, balance: b.netBalance }));
}

/**
 * Derives simple pairwise "who owes whom" entries directly from a group's
 * expenses (before any simplification). For every expense, every
 * participant who is not the payer owes the payer their share amount.
 * Multiple expenses between the same pair are netted together, and any
 * resulting negative amount is flipped (debt direction reversed) so the
 * output only ever contains positive amounts.
 */
export interface ExpenseShareForDebt {
  paidBy: string;
  participantUserId: string;
  shareAmount: number;
}

export function computeDirectDebts(entries: ExpenseShareForDebt[]): { from: string; to: string; amount: number }[] {
  const net = new Map<string, number>(); // key: `${a}|${b}` (a<b lexicographically) => signed amount a owes b

  for (const entry of entries) {
    if (entry.participantUserId === entry.paidBy) continue; // payer's own share isn't a debt
    const [a, b] = [entry.participantUserId, entry.paidBy];
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    const sign = a < b ? 1 : -1; // positive means `a` (first half of key) owes `b`
    net.set(key, (net.get(key) ?? 0) + sign * entry.shareAmount);
  }

  const result: { from: string; to: string; amount: number }[] = [];
  for (const [key, amount] of net.entries()) {
    if (amount === 0) continue;
    const [a, b] = key.split("|");
    if (amount > 0) {
      result.push({ from: a, to: b, amount });
    } else {
      result.push({ from: b, to: a, amount: -amount });
    }
  }
  return result;
}

/**
 * Verifies the fundamental accounting invariant: the net balances of every
 * member in a group must always sum to (approximately) zero, since money
 * is only ever moved between members, never created or destroyed.
 */
export function assertBalancesSumToZero(balances: MemberBalance[], toleranceMinorUnits = 0): void {
  const total = balances.reduce((sum, b) => sum + b.netBalance, 0);
  if (Math.abs(total) > toleranceMinorUnits) {
    throw new Error(
      `Balance invariant violated: sum of net balances should be 0 but was ${total}.`
    );
  }
}
