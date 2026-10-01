"use server";

import { auth } from "@clerk/nextjs/server";
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
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  // Calculate actual split amounts
  const splitsToCreate = payload.participants.map(p => {
    let amountOwed = 0;
    if (payload.splitType === "EQUAL") {
      amountOwed = Math.round(payload.amount / payload.participants.length);
    } else if (payload.splitType === "PERCENTAGE" && p.percentage) {
      amountOwed = Math.round((payload.amount * p.percentage) / 100);
    } else if (payload.splitType === "CUSTOM" && p.shareAmount) {
      amountOwed = p.shareAmount;
    }

    return {
      userId: p.userId,
      amount: amountOwed,
      paid: p.userId === payload.paidBy ? payload.amount : 0,
    };
  });

  // Handle rounding errors for EQUAL splits
  if (payload.splitType === "EQUAL") {
    const totalAssigned = splitsToCreate.reduce((sum, s) => sum + s.amount, 0);
    if (totalAssigned !== payload.amount && splitsToCreate.length > 0) {
      splitsToCreate[0].amount += payload.amount - totalAssigned;
    }
  }

  const expense = await prisma.expense.create({
    data: {
      title: payload.title,
      amount: payload.amount,
      groupId: payload.groupId!,
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
    participants: expense.splits.map(s => ({
      userId: s.userId,
      shareAmount: s.amount,
      percentage: payload.splitType === "PERCENTAGE" ? payload.participants.find(p => p.userId === s.userId)?.percentage : undefined,
    })),
  };
}

export async function getExpenses(filters: { groupId?: string; limit?: number; page?: number } = {}) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const take = filters.limit || 20;
  const skip = ((filters.page || 1) - 1) * take;

  const whereCondition: any = {};
  if (filters.groupId) {
    whereCondition.groupId = filters.groupId;
  } else {
    // Fetch all expenses the user is part of
    whereCondition.OR = [
      { creatorId: dbUser.id },
      { splits: { some: { userId: dbUser.id } } },
    ];
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where: whereCondition,
      include: { splits: true },
      orderBy: { date: 'desc' },
      take,
      skip,
    }),
    prisma.expense.count({ where: whereCondition }),
  ]);

  const items = expenses.map(expense => ({
    id: expense.id,
    groupId: expense.groupId!,
    title: expense.title,
    description: "",
    amount: expense.amount,
    currency: "USD",
    category: expense.categoryId || "General",
    paidBy: expense.creatorId,
    splitType: "EQUAL", // Or fetch from db if saved
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
    }
  };
}


export async function updateExpense(expenseId: string, payload: any) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");
  return prisma.expense.update({ where: { id: expenseId }, data: { title: payload.title, amount: payload.amount, date: payload.date ? new Date(payload.date) : undefined } });
}
export async function deleteExpense(expenseId: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");
  return prisma.expense.delete({ where: { id: expenseId } });
}
export async function getExpenseById(expenseId: string) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");
  const expense = await prisma.expense.findUnique({ where: { id: expenseId }, include: { splits: true } });
  if (!expense) throw new Error("Not found");
  return {
      id: expense.id,
      groupId: expense.groupId,
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
  };
}

