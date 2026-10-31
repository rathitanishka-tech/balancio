"use server";

import { getSession, requireAuth } from "@/lib/auth/session";
import { prisma } from "../db";
import { getOrCreateCurrentUser } from "./user";

export async function createExpense(payload: {
  groupId?: string;
  title: string;
  amount: number;
  currency?: string;
  date?: string;
  category?: string;
  paidBy: string;
  splitType: "EQUAL" | "PERCENTAGE" | "CUSTOM" | "SHARES";
  participants: { userId: string; percentage?: number; shareAmount?: number }[];
}) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  if (!payload.title || !payload.title.trim()) {
    throw new Error("Title is required");
  }

  const amount = Math.round(payload.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  if (!payload.groupId) {
    throw new Error("Group ID is required");
  }

  if (!payload.participants || payload.participants.length === 0) {
    throw new Error("At least one participant is required");
  }

  // Authorization check: Verify caller is a member of the group
  const callerMembership = await prisma.groupMember.findFirst({
    where: { groupId: payload.groupId, userId: dbUser.id },
  });
  if (!callerMembership) {
    throw new Error("Forbidden: You are not a member of this group");
  }

  // Verify group members
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId: payload.groupId },
    select: { userId: true },
  });
  const memberSet = new Set(groupMembers.map((m) => m.userId));

  if (!memberSet.has(payload.paidBy)) {
    throw new Error("The payer must be a member of the group");
  }

  for (const p of payload.participants) {
    if (!memberSet.has(p.userId)) {
      throw new Error(`Participant ${p.userId} is not a member of the group`);
    }
  }

  // Calculate actual split amounts with deterministic cent allocation
  const participantCount = payload.participants.length;
  let splitsToCreate: { userId: string; amount: number; paid: number }[] = [];

  if (payload.splitType === "EQUAL") {
    const baseShare = Math.floor(amount / participantCount);
    let remainder = amount - baseShare * participantCount;

    splitsToCreate = payload.participants.map((p) => {
      let share = baseShare;
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }
      return {
        userId: p.userId,
        amount: share,
        paid: p.userId === payload.paidBy ? amount : 0,
      };
    });
  } else if (payload.splitType === "PERCENTAGE") {
    let runningTotal = 0;
    splitsToCreate = payload.participants.map((p, idx) => {
      let share = Math.round((amount * (p.percentage || 0)) / 100);
      if (idx === participantCount - 1) {
        // Assign remainder to final participant to guarantee exact sum
        share = amount - runningTotal;
      } else {
        runningTotal += share;
      }
      return {
        userId: p.userId,
        amount: share,
        paid: p.userId === payload.paidBy ? amount : 0,
      };
    });
  } else if (payload.splitType === "CUSTOM") {
    const customSum = payload.participants.reduce((sum, p) => sum + Math.round(p.shareAmount || 0), 0);
    if (customSum !== amount) {
      throw new Error(`Custom split amounts (${customSum}) must equal total expense amount (${amount})`);
    }
    splitsToCreate = payload.participants.map((p) => ({
      userId: p.userId,
      amount: Math.round(p.shareAmount || 0),
      paid: p.userId === payload.paidBy ? amount : 0,
    }));
  } else {
    // Default fallback to equal
    const baseShare = Math.floor(amount / participantCount);
    let remainder = amount - baseShare * participantCount;
    splitsToCreate = payload.participants.map((p) => {
      let share = baseShare;
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }
      return {
        userId: p.userId,
        amount: share,
        paid: p.userId === payload.paidBy ? amount : 0,
      };
    });
  }

  const expense = await prisma.expense.create({
    data: {
      title: payload.title.trim(),
      amount,
      groupId: payload.groupId,
      categoryId: payload.category || "General",
      creatorId: payload.paidBy,
      date: payload.date ? new Date(payload.date) : new Date(),
      splits: {
        create: splitsToCreate,
      },
    },
    include: { splits: true },
  });

  return {
    expense: {
      id: expense.id,
      groupId: expense.groupId!,
      title: expense.title,
      description: "",
      amount: expense.amount,
      currency: "USD",
      category: expense.categoryId || "General",
      paidBy: expense.creatorId,
      splitType: payload.splitType,
      date: expense.date.toISOString(),
      createdBy: expense.creatorId,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    },
    participants: expense.splits.map((s) => ({
      userId: s.userId,
      shareAmount: s.amount,
      percentage:
        payload.splitType === "PERCENTAGE"
          ? payload.participants.find((p) => p.userId === s.userId)?.percentage
          : undefined,
    })),
  };
}

export async function getExpenses(filters: { groupId?: string; limit?: number; page?: number } = {}) {
  const session = await getSession();
  const take = filters.limit || 20;
  const emptyResult = {
    items: [],
    pagination: {
      total: 0,
      page: filters.page || 1,
      limit: take,
      totalPages: 1,
    },
  };

  if (!session?.userId) {
    return emptyResult;
  }

  const dbUser = await getOrCreateCurrentUser();
  if (!dbUser) return emptyResult;

  const skip = ((filters.page || 1) - 1) * take;

  try {
    const whereCondition: any = {};
    if (filters.groupId) {
      // Authorization check: Verify caller is a member of the group
      const membership = await prisma.groupMember.findFirst({
        where: { groupId: filters.groupId, userId: dbUser.id },
      });
      if (!membership) {
        throw new Error("Forbidden: You are not a member of this group");
      }
      whereCondition.groupId = filters.groupId;
    } else {
      // Fetch only expenses the user is authorized to see (creator or split participant)
      whereCondition.OR = [
        { creatorId: dbUser.id },
        { splits: { some: { userId: dbUser.id } } },
      ];
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: whereCondition,
        include: { splits: true },
        orderBy: { date: "desc" },
        take,
        skip,
      }),
      prisma.expense.count({ where: whereCondition }),
    ]);

    const items = expenses.map((expense) => ({
      id: expense.id,
      groupId: expense.groupId || "",
      title: expense.title,
      description: "",
      amount: expense.amount,
      currency: "USD",
      category: expense.categoryId || "General",
      paidBy: expense.creatorId,
      splitType: "EQUAL",
      date: expense.date.toISOString(),
      createdBy: expense.creatorId,
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    }));

    return {
      items,
      pagination: {
        total,
        page: filters.page || 1,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  } catch (err: any) {
    if (err?.message?.includes("Forbidden")) {
      throw err;
    }
    console.error("[GET_EXPENSES_DB_ERROR]", err?.message || err);
    return emptyResult;
  }
}

export async function getExpenseById(expenseId: string) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { splits: true, group: true },
  });

  if (!expense) throw new Error("Not found");

  // Authorization check: Verify caller is creator, in splits, or in the group
  let isAuthorized = expense.creatorId === dbUser.id || expense.splits.some((s) => s.userId === dbUser.id);
  if (!isAuthorized && expense.groupId) {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: expense.groupId, userId: dbUser.id },
    });
    if (membership) isAuthorized = true;
  }

  if (!isAuthorized) {
    throw new Error("Forbidden: You do not have access to this expense");
  }

  const expenseObj = {
    id: expense.id,
    groupId: expense.groupId || "",
    title: expense.title,
    description: "",
    amount: expense.amount,
    currency: "USD",
    category: expense.categoryId || "General",
    paidBy: expense.creatorId,
    splitType: "EQUAL" as const,
    date: expense.date.toISOString(),
    createdBy: expense.creatorId,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };

  const participants = expense.splits.map((s) => ({
    userId: s.userId,
    shareAmount: s.amount,
  }));

  return {
    expense: expenseObj,
    participants,
  };
}

export async function updateExpense(expenseId: string, payload: any) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const existing = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { splits: true },
  });

  if (!existing) throw new Error("Not found");

  // Authorization check: Only creator or group admin/owner can edit
  let canEdit = existing.creatorId === dbUser.id;
  if (!canEdit && existing.groupId) {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: existing.groupId, userId: dbUser.id },
    });
    if (membership && (membership.role === "owner" || membership.role === "admin" || membership.role === "OWNER" || membership.role === "ADMIN")) {
      canEdit = true;
    }
  }

  if (!canEdit) throw new Error("Forbidden: You cannot edit this expense");

  const newAmount = payload.amount !== undefined ? Math.round(payload.amount) : existing.amount;
  if (isNaN(newAmount) || newAmount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const splitType = payload.splitType || "EQUAL";
  const participants = payload.participants && payload.participants.length > 0
    ? payload.participants
    : existing.splits.map((s) => ({ userId: s.userId }));

  const participantCount = participants.length;
  let splitsToCreate: { userId: string; amount: number; paid: number }[] = [];
  const paidBy = payload.paidBy || existing.creatorId;

  if (splitType === "EQUAL") {
    const baseShare = Math.floor(newAmount / participantCount);
    let remainder = newAmount - baseShare * participantCount;
    splitsToCreate = participants.map((p: any) => {
      let share = baseShare;
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }
      return {
        userId: p.userId,
        amount: share,
        paid: p.userId === paidBy ? newAmount : 0,
      };
    });
  } else if (splitType === "PERCENTAGE") {
    let runningTotal = 0;
    splitsToCreate = participants.map((p: any, idx: number) => {
      let share = Math.round((newAmount * (p.percentage || 0)) / 100);
      if (idx === participantCount - 1) {
        share = newAmount - runningTotal;
      } else {
        runningTotal += share;
      }
      return {
        userId: p.userId,
        amount: share,
        paid: p.userId === paidBy ? newAmount : 0,
      };
    });
  } else if (splitType === "CUSTOM") {
    const customSum = participants.reduce((sum: number, p: any) => sum + Math.round(p.shareAmount || 0), 0);
    if (customSum !== newAmount) {
      throw new Error(`Custom split amounts (${customSum}) must equal total expense amount (${newAmount})`);
    }
    splitsToCreate = participants.map((p: any) => ({
      userId: p.userId,
      amount: Math.round(p.shareAmount || 0),
      paid: p.userId === paidBy ? newAmount : 0,
    }));
  }

  // Atomic transaction to update expense and recalculate splits
  const updatedExpense = await prisma.$transaction(async (tx) => {
    // Delete existing splits
    await tx.split.deleteMany({ where: { expenseId } });

    // Update expense record and insert new splits
    return await tx.expense.update({
      where: { id: expenseId },
      data: {
        title: payload.title ? payload.title.trim() : existing.title,
        amount: newAmount,
        categoryId: payload.category || existing.categoryId,
        creatorId: paidBy,
        date: payload.date ? new Date(payload.date) : existing.date,
        splits: {
          create: splitsToCreate,
        },
      },
      include: { splits: true },
    });
  });

  const expenseObj = {
    id: updatedExpense.id,
    groupId: updatedExpense.groupId || "",
    title: updatedExpense.title,
    description: "",
    amount: updatedExpense.amount,
    currency: "USD",
    category: updatedExpense.categoryId || "General",
    paidBy: updatedExpense.creatorId,
    splitType,
    date: updatedExpense.date.toISOString(),
    createdBy: updatedExpense.creatorId,
    createdAt: updatedExpense.createdAt.toISOString(),
    updatedAt: updatedExpense.updatedAt.toISOString(),
  };

  const updatedParticipants = updatedExpense.splits.map((s) => ({
    userId: s.userId,
    shareAmount: s.amount,
  }));

  return {
    ...expenseObj,
    expense: expenseObj,
    participants: updatedParticipants,
  };
}

export async function deleteExpense(expenseId: string) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!expense) throw new Error("Not found");

  // Authorization check: Only creator or group owner can delete
  let canDelete = expense.creatorId === dbUser.id;
  if (!canDelete && expense.groupId) {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: expense.groupId, userId: dbUser.id },
    });
    if (membership && (membership.role === "owner" || membership.role === "OWNER")) {
      canDelete = true;
    }
  }

  if (!canDelete) throw new Error("Forbidden: You cannot delete this expense");

  return prisma.expense.delete({ where: { id: expenseId } });
}
