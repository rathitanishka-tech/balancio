"use server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "../db";
import { getOrCreateCurrentUser } from "./user";
import type { CreateSettlementPayload, SettlementFilters } from "@/types/settlement";

export async function createSettlement(payload: CreateSettlementPayload) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const amount = Math.round(payload.amount);
  if (isNaN(amount) || amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  if (!payload.groupId) {
    throw new Error("Group ID is required");
  }

  if (payload.fromUser === payload.toUser) {
    throw new Error("Payer and payee cannot be the same user");
  }

  // Authorization check: Verify caller is a member of the group
  const callerMembership = await prisma.groupMember.findFirst({
    where: { groupId: payload.groupId, userId: dbUser.id },
  });
  if (!callerMembership) {
    throw new Error("Forbidden: You are not a member of this group");
  }

  // Verify fromUser and toUser are members of the group
  const groupMembers = await prisma.groupMember.findMany({
    where: { groupId: payload.groupId },
    select: { userId: true },
  });
  const memberSet = new Set(groupMembers.map((m) => m.userId));

  if (!memberSet.has(payload.fromUser) || !memberSet.has(payload.toUser)) {
    throw new Error("Both participants must be members of the group");
  }

  const settlement = await prisma.settlement.create({
    data: {
      groupId: payload.groupId,
      fromUserId: payload.fromUser,
      toUserId: payload.toUser,
      amount,
      paymentMethod: payload.paymentMethod || "CASH",
      note: payload.note ? payload.note.trim() : null,
      date: payload.date ? new Date(payload.date) : new Date(),
      createdById: dbUser.id,
    },
  });

  return {
    id: settlement.id,
    groupId: settlement.groupId,
    fromUser: settlement.fromUserId,
    toUser: settlement.toUserId,
    amount: settlement.amount,
    currency: settlement.currency,
    paymentMethod: settlement.paymentMethod as any,
    note: settlement.note || undefined,
    date: settlement.date.toISOString(),
    createdBy: settlement.createdById,
    createdAt: settlement.createdAt.toISOString(),
  };
}

export async function getSettlements(filters: SettlementFilters = {}) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const take = filters.limit || 20;
  const skip = ((filters.page || 1) - 1) * take;

  const whereCondition: any = {};
  if (filters.group) {
    // Authorization check: Verify caller is a member of the requested group
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: filters.group, userId: dbUser.id },
    });
    if (!membership) {
      throw new Error("Forbidden: You are not a member of this group");
    }
    whereCondition.groupId = filters.group;
  } else if (filters.userId) {
    // Only allow querying own settlements or if caller is querying self
    if (filters.userId !== dbUser.id) {
      throw new Error("Forbidden: Cannot query settlements for another user directly");
    }
    whereCondition.OR = [
      { fromUserId: dbUser.id },
      { toUserId: dbUser.id },
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
      orderBy: { date: "desc" },
      take,
      skip,
    }),
    prisma.settlement.count({ where: whereCondition }),
  ]);

  const items = settlements.map((s) => ({
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
    },
  };
}

export async function deleteSettlement(settlementId: string) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const settlement = await prisma.settlement.findUnique({
    where: { id: settlementId },
  });

  if (!settlement) {
    throw new Error("Not found");
  }

  // Authorization check: Creator, payer, payee, or group owner can delete
  let canDelete =
    settlement.createdById === dbUser.id ||
    settlement.fromUserId === dbUser.id ||
    settlement.toUserId === dbUser.id;

  if (!canDelete && settlement.groupId) {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: settlement.groupId, userId: dbUser.id },
    });
    if (membership && (membership.role === "owner" || membership.role === "OWNER")) {
      canDelete = true;
    }
  }

  if (!canDelete) {
    throw new Error("Forbidden: You cannot delete this settlement");
  }

  return prisma.settlement.delete({
    where: { id: settlementId },
  });
}
