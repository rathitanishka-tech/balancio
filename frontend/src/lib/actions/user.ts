"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../db";

export async function getOrCreateCurrentUser() {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await currentUser();
  if (!user) {
    throw new Error("Clerk user not found");
  }

  const email = user.emailAddresses[0]?.emailAddress ?? "";
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || email.split("@")[0];

  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    update: { email, name },
    create: { clerkId: userId, email, name },
  });

  return dbUser;
}
