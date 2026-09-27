import { RawBalance, SimplifiedTransaction } from "../types/balance.types";

/**
 * DEBT SIMPLIFICATION ALGORITHM
 * =======================================================================
 * Given each member's net balance (positive = owed money, negative = owes
 * money), produce the smallest practical set of payments that settles the
 * whole group, WITHOUT changing how much money each person ultimately
 * owes or is owed. This is the classic "greedy min-cash-flow" heuristic:
 *
 *   1. Split members into debtors (balance < 0) and creditors (balance > 0).
 *      Members who are already at zero need no transaction.
 *   2. Repeatedly take the debtor who owes the MOST and the creditor who is
 *      owed the MOST.
 *   3. Transfer min(|debtor balance|, creditor balance) between them -
 *      this is the largest amount that can move without overpaying either
 *      side.
 *   4. Reduce both balances by that transferred amount. Whichever one(s)
 *      reach zero drop out of consideration.
 *   5. Repeat until every balance is zero (within a negligible rounding
 *      tolerance).
 *
 * Matching the largest debtor with the largest creditor at every step is a
 * well known greedy strategy that keeps the number of resulting
 * transactions small (at most n-1 for n non-zero balances), though it is
 * not formally guaranteed to be the mathematically optimal minimum for
 * every possible input (that variant of the problem is NP-hard in
 * general). For a group expense app this greedy result is exactly what
 * users expect ("simplify debts").
 *
 * INVARIANTS (see tests/algorithms/debtSimplification.test.ts):
 *   - Money is conserved: sum(input balances) === sum(output balances) (both 0).
 *   - No transaction is ever created for/with a zero amount.
 *   - Every debtor's total outgoing transactions equal their original debt.
 *   - Every creditor's total incoming transactions equal what they were owed.
 */

const ZERO_TOLERANCE = 0; // amounts are integer minor units, so exact equality is expected

interface MutableEntry {
  userId: string;
  amount: number; // always stored as a positive magnitude
}

export function simplifyDebts(balances: RawBalance[]): SimplifiedTransaction[] {
  const debtors: MutableEntry[] = [];
  const creditors: MutableEntry[] = [];

  let sumCheck = 0;
  for (const b of balances) {
    sumCheck += b.balance;
    if (b.balance < -ZERO_TOLERANCE) {
      debtors.push({ userId: b.userId, amount: -b.balance });
    } else if (b.balance > ZERO_TOLERANCE) {
      creditors.push({ userId: b.userId, amount: b.balance });
    }
    // balances within tolerance of zero are already settled - ignored.
  }

  if (Math.abs(sumCheck) > ZERO_TOLERANCE) {
    throw new Error(
      `simplifyDebts: input balances must sum to zero (received sum ${sumCheck}). ` +
        `This indicates a bug upstream in balance calculation, not a valid group state.`
    );
  }

  const transactions: SimplifiedTransaction[] = [];

  // Greedy loop: always match the current largest debtor with the current
  // largest creditor. Re-sorting on every iteration is O(n^2 log n) in the
  // worst case, which is more than fast enough for realistic group sizes
  // (tens to low hundreds of members).
  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debtor = debtors[0];
    const creditor = creditors[0];

    const transferAmount = Math.min(debtor.amount, creditor.amount);

    if (transferAmount > 0) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: transferAmount
      });
    }

    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;

    if (debtor.amount <= ZERO_TOLERANCE) {
      debtors.shift();
    }
    if (creditor.amount <= ZERO_TOLERANCE) {
      creditors.shift();
    }
  }

  return transactions;
}

/**
 * Convenience helper: verifies that a set of simplified transactions,
 * when applied on top of the original balances, brings every member back
 * to exactly zero. Used defensively by the debt service before returning
 * a simplification result to the API, and by tests.
 */
export function verifySimplification(
  originalBalances: RawBalance[],
  transactions: SimplifiedTransaction[]
): boolean {
  const resulting = new Map<string, number>();
  for (const b of originalBalances) resulting.set(b.userId, b.balance);

  for (const t of transactions) {
    resulting.set(t.from, (resulting.get(t.from) ?? 0) + t.amount);
    resulting.set(t.to, (resulting.get(t.to) ?? 0) - t.amount);
  }

  for (const value of resulting.values()) {
    if (Math.abs(value) > ZERO_TOLERANCE) return false;
  }
  return true;
}
