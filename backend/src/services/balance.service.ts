import { Expense } from "../models/Expense";
import { ExpenseParticipant } from "../models/ExpenseParticipant";
import { Settlement } from "../models/Settlement";
import { groupRepository } from "../repositories/group.repository";
import { userRepository } from "../repositories/user.repository";
import { NotFoundError } from "../utils/errors";
import {
  computeMemberBalances,
  assertBalancesSumToZero,
  MemberAggregate
} from "../algorithms/balanceCalculation";
import { MemberBalance } from "../types/balance.types";
import { assertGroupRole } from "../middleware/role.middleware";

/**
 * GET /api/groups/:groupId/balances
 * ---------------------------------------------------------------------
 * This is the service-level `calculateGroupBalances(groupId)` referenced
 * in the spec. It fetches the raw aggregates from MongoDB, then hands
 * them to the pure, DB-free algorithm in algorithms/balanceCalculation.ts.
 */
export async function calculateGroupBalances(groupId: string, requestingUserId: string): Promise<MemberBalance[]> {
  const group = await groupRepository.findById(groupId);
  if (!group) throw new NotFoundError("Group");

  await assertGroupRole(groupId, requestingUserId, ["OWNER", "ADMIN", "MEMBER"]);

  const members = await groupRepository.listMembers(groupId);
  const users = await userRepository.findByIds(members.map((m) => m.userId));
  const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

  const expenses = await Expense.find({ groupId, deletedAt: null }).select("_id paidBy amount");
  const expenseIds = expenses.map((e) => e._id);

  const participants = await ExpenseParticipant.find({ expenseId: { $in: expenseIds } }).select(
    "userId shareAmount"
  );

  const settlements = await Settlement.find({ groupId }).select("fromUser toUser amount");

  const totalPaidByUser = new Map<string, number>();
  for (const e of expenses) {
    const key = e.paidBy.toString();
    totalPaidByUser.set(key, (totalPaidByUser.get(key) ?? 0) + e.amount);
  }

  const totalOwedByUser = new Map<string, number>();
  for (const p of participants) {
    const key = p.userId.toString();
    totalOwedByUser.set(key, (totalOwedByUser.get(key) ?? 0) + p.shareAmount);
  }

  const settlementsPaidByUser = new Map<string, number>();
  const settlementsReceivedByUser = new Map<string, number>();
  for (const s of settlements) {
    const fromKey = s.fromUser.toString();
    const toKey = s.toUser.toString();
    settlementsPaidByUser.set(fromKey, (settlementsPaidByUser.get(fromKey) ?? 0) + s.amount);
    settlementsReceivedByUser.set(toKey, (settlementsReceivedByUser.get(toKey) ?? 0) + s.amount);
  }

  const aggregates: MemberAggregate[] = members.map((m) => {
    const userId = m.userId.toString();
    return {
      userId,
      name: userMap.get(userId) ?? "Unknown",
      totalPaid: totalPaidByUser.get(userId) ?? 0,
      totalOwed: totalOwedByUser.get(userId) ?? 0,
      settlementsPaid: settlementsPaidByUser.get(userId) ?? 0,
      settlementsReceived: settlementsReceivedByUser.get(userId) ?? 0
    };
  });

  const balances = computeMemberBalances(aggregates);

  // Financial invariant: the group's balances must always net to zero.
  // If this ever fails it indicates a bug upstream (e.g. a split that
  // didn't sum to the expense total slipped past validation) - we refuse
  // to silently return incorrect data.
  assertBalancesSumToZero(balances);

  return balances;
}

export const balanceService = { calculateGroupBalances };
