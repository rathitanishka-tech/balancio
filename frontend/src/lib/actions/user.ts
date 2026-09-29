"use server";

import { requireAuth } from "@/lib/auth/session";
import { prisma } from "../db";

export async function getOrCreateCurrentUser() {
  const { userId } = await requireAuth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!dbUser) {
    throw new Error("User not found");
  }

  return dbUser;
}
