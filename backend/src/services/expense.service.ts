import { Types } from "mongoose";
import { expenseRepository, ExpenseListFilter } from "../repositories/expense.repository";
import { groupRepository } from "../repositories/group.repository";
import { userRepository } from "../repositories/user.repository";
import { assertGroupRole } from "../middleware/role.middleware";
import { calculateSplit } from "../algorithms/splitCalculation";
import { withTransaction } from "../utils/transaction";
import { NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors";
import { CreateExpenseInput, UpdateExpenseInput, ExpenseFilters } from "../types/expense.types";
import { IExpense } from "../models/Expense";
import { activityService } from "./activity.service";
import { notificationService } from "./notification.service";
import { parsePagination, buildPaginationMeta, PaginationMeta } from "../utils/pagination";
import { parseDateOrUndefined } from "../utils/dates";

/**
 * Verifies the payer and every participant actually belong to the group.
 * Financial values must never be trusted from the client without this
 * check - otherwise someone could split an expense onto users outside
 * the group, or claim to have paid on behalf of a group they're not in.
 */
async function assertParticipantsBelongToGroup(groupId: string, paidBy: string, participantIds: string[]) {
  const memberIds = new Set(await groupRepository.listMemberIds(groupId));

  if (!memberIds.has(paidBy)) {
    throw new ValidationError("The payer must be a member of the group");
  }
  for (const id of participantIds) {
    if (!memberIds.has(id)) {
      throw new ValidationError(`Participant ${id} is not a member of this group`);
    }
  }
}

export const expenseService = {
  async createExpense(actorId: string, input: CreateExpenseInput): Promise<{ expense: IExpense; participants: { userId: string; shareAmount: number; percentage?: number }[] }> {
    const group = await groupRepository.findById(input.groupId);
    if (!group) throw new NotFoundError("Group");

    // Any group member (MEMBER/ADMIN/OWNER) may create an expense.
    await assertGroupRole(input.groupId, actorId, ["OWNER", "ADMIN", "MEMBER"]);

    const participantIds = input.participants.map((p) => p.userId);
    await assertParticipantsBelongToGroup(input.groupId, input.paidBy, participantIds);

    // The backend - never the client - computes the resulting shares.
    const shares = calculateSplit(input.splitType, input.amount, input.participants);

    const result = await withTransaction(async (session) => {
      const expense = await expenseRepository.create(
        {
          groupId: new Types.ObjectId(input.groupId) as unknown as IExpense["groupId"],
          title: input.title,
          description: input.description,
          amount: input.amount,
          currency: input.currency ?? group.currency,
          category: input.category ?? "General",
          paidBy: new Types.ObjectId(input.paidBy) as unknown as IExpense["paidBy"],
          splitType: input.splitType,
          date: input.date ? new Date(input.date) : new Date(),
          createdBy: new Types.ObjectId(actorId) as unknown as IExpense["createdBy"],
          receipt: input.receipt
        },
        session
      );

      await expenseRepository.setParticipants(expense._id.toString(), shares, session);

      return expense;
    });

    await activityService.record(input.groupId, actorId, "expense_created", {
      expenseId: result._id.toString(),
      amount: input.amount,
      title: input.title
    });

    // Notify every participant (except whoever created the expense) that
    // a new expense affects them.
    const notifyTargets = shares.filter((s) => s.userId !== actorId);
    await notificationService.notifyMany(
      notifyTargets.map((s) => ({
        userId: s.userId,
        type: s.userId === input.paidBy ? "YOU_ARE_OWED" : "YOU_OWE",
        title: "New expense added",
        message: `"${input.title}" was added to ${group.name}. Your share is ${s.shareAmount} ${
          input.currency ?? group.currency
        } (minor units).`,
        relatedGroupId: input.groupId,
        relatedExpenseId: result._id.toString()
      }))
    );

    return { expense: result, participants: shares };
  },

  async getExpense(expenseId: string, userId: string): Promise<{ expense: IExpense; participants: { userId: string; shareAmount: number; percentage?: number }[] }> {
    const expense = await expenseRepository.findById(expenseId);
    if (!expense) throw new NotFoundError("Expense");

    await assertGroupRole(expense.groupId.toString(), userId, ["OWNER", "ADMIN", "MEMBER"]);

    const participants = await expenseRepository.findParticipants(expenseId);
    return {
      expense,
      participants: participants.map((p) => ({
        userId: p.userId.toString(),
        shareAmount: p.shareAmount,
        percentage: p.percentage
      }))
    };
  },

  async updateExpense(expenseId: string, actorId: string, input: UpdateExpenseInput): Promise<IExpense> {
    const expense = await expenseRepository.findById(expenseId);
    if (!expense) throw new NotFoundError("Expense");

    // Only admins/owner or whoever created the expense may edit it.
    const role = await assertGroupRole(expense.groupId.toString(), actorId, ["OWNER", "ADMIN", "MEMBER"]);
    const isCreator = expense.createdBy.toString() === actorId;
    if (role === "MEMBER" && !isCreator) {
      throw new UnauthorizedError("Only the expense creator or a group admin can edit this expense");
    }

    const newAmount = input.amount ?? expense.amount;
    const newSplitType = input.splitType ?? expense.splitType;

    let shares: { userId: string; shareAmount: number; percentage?: number }[] | undefined;
    if (input.participants || input.amount !== undefined || input.splitType !== undefined) {
      const existingParticipants = await expenseRepository.findParticipants(expenseId);
      const participantsInput =
        input.participants ??
        existingParticipants.map((p) => ({
          userId: p.userId.toString(),
          shareAmount: p.shareAmount,
          percentage: p.percentage
        }));

      const paidBy = input.paidBy ?? expense.paidBy.toString();
      const participantIds = participantsInput.map((p) => p.userId);
      await assertParticipantsBelongToGroup(expense.groupId.toString(), paidBy, participantIds);

      shares = calculateSplit(newSplitType, newAmount, participantsInput);
    }

    const updated = await withTransaction(async (session) => {
      const updatedExpense = await expenseRepository.updateById(
        expenseId,
        {
          title: input.title,
          description: input.description,
          amount: input.amount,
          currency: input.currency,
          category: input.category,
          paidBy: input.paidBy ? (new Types.ObjectId(input.paidBy) as unknown as IExpense["paidBy"]) : undefined,
          splitType: input.splitType,
          date: input.date ? new Date(input.date) : undefined,
          receipt: input.receipt
        },
        session
      );
      if (!updatedExpense) throw new NotFoundError("Expense");

      if (shares) {
        await expenseRepository.setParticipants(expenseId, shares, session);
      }

      return updatedExpense;
    });

    await activityService.record(expense.groupId.toString(), actorId, "expense_updated", {
      expenseId,
      changes: input
    });

    if (shares) {
      const notifyTargets = shares.filter((s) => s.userId !== actorId);
      await notificationService.notifyMany(
        notifyTargets.map((s) => ({
          userId: s.userId,
          type: "EXPENSE_UPDATED" as const,
          title: "An expense was updated",
          message: `"${updated.title}" was updated. Your new share is ${s.shareAmount} (minor units).`,
          relatedGroupId: expense.groupId.toString(),
          relatedExpenseId: expenseId
        }))
      );
    }

    return updated;
  },

  async deleteExpense(expenseId: string, actorId: string): Promise<void> {
    const expense = await expenseRepository.findById(expenseId);
    if (!expense) throw new NotFoundError("Expense");

    const role = await assertGroupRole(expense.groupId.toString(), actorId, ["OWNER", "ADMIN", "MEMBER"]);
    const isCreator = expense.createdBy.toString() === actorId;
    if (role === "MEMBER" && !isCreator) {
      throw new UnauthorizedError("Only the expense creator or a group admin can delete this expense");
    }

    const participants = await expenseRepository.findParticipants(expenseId);

    await withTransaction(async (session) => {
      await expenseRepository.softDelete(expenseId, session);
      await expenseRepository.deleteParticipants(expenseId, session);
    });

    await activityService.record(expense.groupId.toString(), actorId, "expense_deleted", {
      expenseId,
      title: expense.title
    });

    const notifyTargets = participants.filter((p) => p.userId.toString() !== actorId);
    await notificationService.notifyMany(
      notifyTargets.map((p) => ({
        userId: p.userId.toString(),
        type: "EXPENSE_DELETED" as const,
        title: "An expense was deleted",
        message: `"${expense.title}" was removed from the group.`,
        relatedGroupId: expense.groupId.toString()
      }))
    );
  },

  async listExpenses(
    userId: string,
    filters: ExpenseFilters
  ): Promise<{ items: IExpense[]; pagination: PaginationMeta }> {
    if (filters.group) {
      await assertGroupRole(filters.group, userId, ["OWNER", "ADMIN", "MEMBER"]);
    }

    const { page, limit, skip } = parsePagination(filters as unknown as Record<string, unknown>);

    const repoFilter: ExpenseListFilter = {
      groupId: filters.group,
      category: filters.category,
      dateFrom: parseDateOrUndefined(filters.dateFrom),
      dateTo: parseDateOrUndefined(filters.dateTo),
      paidBy: filters.paidBy,
      participantUserId: filters.participant
    };

    if (!filters.group) {
      // No group specified: restrict results to groups the user belongs to.
      const memberships = await groupRepository.listGroupsForUser(userId);
      const groupIds = memberships.map((m) => m.groupId.toString());
      if (groupIds.length === 0) {
        return { items: [], pagination: buildPaginationMeta(page, limit, 0) };
      }
      // expenseRepository.list only supports a single groupId filter, so
      // for the "all my groups" case we widen the filter manually.
      const { items, total } = await expenseRepository.list(
        { ...repoFilter, groupId: undefined },
        skip,
        limit
      );
      const filtered = items.filter((e) => groupIds.includes(e.groupId.toString()));
      return { items: filtered, pagination: buildPaginationMeta(page, limit, total) };
    }

    const { items, total } = await expenseRepository.list(repoFilter, skip, limit);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  },

  async ensureUsersExist(userIds: string[]): Promise<void> {
    const users = await userRepository.findByIds(userIds);
    if (users.length !== new Set(userIds).size) {
      throw new ValidationError("One or more participant userIds do not exist");
    }
  }
};
