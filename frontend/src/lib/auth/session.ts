import { prisma } from "../db";

import { getSyncedUser } from "./sync";

export async function getSession() {
  const syncedUser = await getSyncedUser();
  if (syncedUser) {
    return { userId: syncedUser.id, clerkAuth: true };
  }

  return null;
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  return user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
