"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../db";
import { getOrCreateCurrentUser } from "./user";
import type { CreateSettlementPayload, SettlementFilters } from "@/types/settlement";

export async function createSettlement(payload: CreateSettlementPayload) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const settlement = await prisma.settlement.create({
    data: {
      groupId: payload.groupId,
      fromUserId: payload.fromUser,
      toUserId: payload.toUser,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod || "CASH",
      note: payload.note,
      date: payload.date ? new Date(payload.date) : new Date(),
      createdById: dbUser.id,
    }
  });

  return {
    id: settlement.id,
    groupId: settlement.groupId,
    fromUser: settlement.fromUserId,
    toUser: settlement.toUserId,
    amount: settlement.amount,
    currency: settlement.currency,
    paymentMethod: settlement.paymentMethod,
    note: settlement.note || undefined,
    date: settlement.date.toISOString(),
    createdBy: settlement.createdById,
    createdAt: settlement.createdAt.toISOString(),
  };
}

export async function getSettlements(filters: SettlementFilters = {}) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const take = filters.limit || 20;
  const skip = ((filters.page || 1) - 1) * take;

  const whereCondition: any = {};
  if (filters.group) {
    whereCondition.groupId = filters.group;
  } else if (filters.userId) {
    whereCondition.OR = [
      { fromUserId: filters.userId },
      { toUserId: filters.userId },
    ];
  } else {
    whereCondition.OR = [
      { fromUserId: dbUser.id },
      { toUserId: dbUser.id },
    ];
  }

  const [settlements, total] = await Promise.all([
    prisma.settlement.findMany({
      where: whereCondition,
      orderBy: { date: 'desc' },
      take,
      skip,
    }),
    prisma.settlement.count({ where: whereCondition }),
  ]);

  const items = settlements.map(s => ({
    id: s.id,
    groupId: s.groupId,
    fromUser: s.fromUserId,
    toUser: s.toUserId,
    amount: s.amount,
    currency: s.currency,
    paymentMethod: s.paymentMethod as any,
    note: s.note || undefined,
    date: s.date.toISOString(),
    createdBy: s.createdById,
    createdAt: s.createdAt.toISOString(),
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

