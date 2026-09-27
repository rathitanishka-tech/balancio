import { Expense } from "../models/Expense";
import { ExpenseParticipant } from "../models/ExpenseParticipant";
import { Settlement } from "../models/Settlement";
import { groupRepository } from "../repositories/group.repository";
import { userRepository } from "../repositories/user.repository";
import { NotFoundError, InvariantViolationError } from "../utils/errors";
import { simplifyDebts, verifySimplification } from "../algorithms/debtSimplification";
import { toRawBalances } from "../algorithms/balanceCalculation";
import { calculateGroupBalances } from "./balance.service";
import { DirectDebt } from "../types/balance.types";

interface PairwiseEntry {
  from: string;
  to: string;
  amount: number; // positive means `from` owes `to`
}

/**
 * Nets a list of directed, signed pairwise amounts down to the minimal set
 * of non-zero (from, to, amount) entries. Used to combine expense-share
 * debts (positive: "participant owes payer") with settlement adjustments
 * (negative: a settlement reduces what the payer owes) into a single
 * up-to-date "who owes whom" view - i.e. this reflects amounts still
 * outstanding *after* settlements, not just the raw historical expense
 * split.
 */
function netPairwiseAmounts(entries: PairwiseEntry[]): DirectDebt[] {
  const net = new Map<string, number>();

  for (const e of entries) {
    if (e.from === e.to || e.amount === 0) continue;
    const [a, b] = e.from < e.to ? [e.from, e.to] : [e.to, e.from];
    const sign = e.from < e.to ? 1 : -1;
    const key = `${a}|${b}`;
    net.set(key, (net.get(key) ?? 0) + sign * e.amount);
  }

  const result: DirectDebt[] = [];
  for (const [key, amount] of net.entries()) {
    if (amount === 0) continue;
    const [a, b] = key.split("|");
    if (amount > 0) result.push({ from: a, to: b, amount });
    else result.push({ from: b, to: a, amount: -amount });
  }
  return result;
}

export const debtService = {
  /**
   * GET /api/groups/:groupId/debts
   * Direct, pairwise "who owes whom" - already netted against settlements,
   * but NOT run through the simplification algorithm, so transitive/
   * circular debts between three or more people are shown as-is.
   */
  async getDirectDebts(groupId: string, requestingUserId: string): Promise<DirectDebt[]> {
    const group = await groupRepository.findById(groupId);
    if (!group) throw new NotFoundError("Group");

    // Membership check is delegated to calculateGroupBalances below via
    // assertGroupRole, but we also need it here since we query directly.
    await calculateGroupBalances(groupId, requestingUserId); // throws if not a member; also validates invariants

    const expenses = await Expense.find({ groupId, deletedAt: null }).select("_id paidBy");
    const paidByMap = new Map(expenses.map((e) => [e._id.toString(), e.paidBy.toString()]));
    const expenseIds = expenses.map((e) => e._id);

    const participants = await ExpenseParticipant.find({ expenseId: { $in: expenseIds } }).select(
      "expenseId userId shareAmount"
    );

    const expenseEntries: PairwiseEntry[] = participants
      .map((p) => ({
        from: p.userId.toString(),
        to: paidByMap.get(p.expenseId.toString())!,
        amount: p.shareAmount
      }))
      .filter((e) => e.from !== e.to);

    const settlements = await Settlement.find({ groupId }).select("fromUser toUser amount");
    const settlementEntries: PairwiseEntry[] = settlements.map((s) => ({
      from: s.fromUser.toString(),
      to: s.toUser.toString(),
      amount: -s.amount // paying reduces what `from` owes `to`
    }));

    return netPairwiseAmounts([...expenseEntries, ...settlementEntries]);
  },

  /**
   * GET /api/groups/:groupId/debts/simplified
   * Runs the greedy debt-simplification algorithm over each member's net
   * balance to produce the minimal practical set of settle-up payments.
   */
  async getSimplifiedDebts(
    groupId: string,
    requestingUserId: string
  ): Promise<{ transactions: { from: { id: string; name: string }; to: { id: string; name: string }; amount: number }[]; transactionCount: number }> {
    const balances = await calculateGroupBalances(groupId, requestingUserId);

    const rawBalances = toRawBalances(balances);
    const transactions = simplifyDebts(rawBalances);

    if (!verifySimplification(rawBalances, transactions)) {
      // This should never happen given a correct algorithm - refuse to
      // return incorrect financial data rather than silently proceeding.
      throw new InvariantViolationError(
        "Debt simplification failed its own consistency check; refusing to return possibly-incorrect data."
      );
    }

    const nameMap = new Map(balances.map((b) => [b.userId, b.name]));
    const users = await userRepository.findByIds(transactions.flatMap((t) => [t.from, t.to]));
    const dbNameMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    const enriched = transactions.map((t) => ({
      from: { id: t.from, name: nameMap.get(t.from) ?? dbNameMap.get(t.from) ?? "Unknown" },
      to: { id: t.to, name: nameMap.get(t.to) ?? dbNameMap.get(t.to) ?? "Unknown" },
      amount: t.amount
    }));

    return { transactions: enriched, transactionCount: enriched.length };
  }
};
