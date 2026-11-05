import { prisma } from "../db";
import { getSyncedUser } from "./sync";
import * as React from "react";

const safeCache = (React as any).cache || (<T extends Function>(fn: T): T => fn);

export const getSession = safeCache(async function getSession() {
  const syncedUser = await getSyncedUser();
  if (syncedUser) {
    return { userId: syncedUser.id, clerkAuth: true };
  }

  return null;
});

export const getCurrentUser = safeCache(async function getCurrentUser() {
  // If getSyncedUser has already resolved for this request, reuse it directly without an extra DB query
  const syncedUser = await getSyncedUser();
  if (syncedUser) return syncedUser;

  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  return user;
});

export const requireAuth = safeCache(async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
});
