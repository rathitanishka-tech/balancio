"use server";

import { requireAuth, getCurrentUser } from "@/lib/auth/session";
import { prisma } from "../db";
import * as React from "react";

const safeCache = (React as any).cache || (<T extends Function>(fn: T): T => fn);

export const getCurrentUserOrNull = safeCache(async function getCurrentUserOrNull() {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    // Never leak password hash to the client
    const { password: _, ...safeUser } = user;
    return safeUser;
  } catch (err: any) {
    console.error("[GET_CURRENT_USER_DB_ERROR]", err?.message || err);
    return null;
  }
});

export async function getOrCreateCurrentUser() {
  const user = await getCurrentUserOrNull();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function updateUserProfile(payload: { name?: string; avatar?: string }) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const updateData: { name?: string } = {};
  if (payload.name && payload.name.trim()) {
    updateData.name = payload.name.trim();
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  const { password: _, ...safeUser } = updatedUser;
  return safeUser;
}
