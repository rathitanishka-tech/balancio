import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../db";
import * as React from "react";

const safeCache = (React as any).cache || (<T extends Function>(fn: T): T => fn);

export const getSyncedUser = safeCache(async function getSyncedUser() {
  const { userId: clerkId } = auth();
  if (!clerkId) return null;

  try {
    // 1. Check if user exists with this clerkId
    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (user) return user;

    // 2. Fetch Clerk user details to get email
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const primaryEmailObj = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    ) || clerkUser.emailAddresses[0];

    const email = primaryEmailObj?.emailAddress;
    if (!email) return null;

    const isVerified = primaryEmailObj?.verification?.status === "verified";

    // 3. Find user by email
    const usersWithEmail = await prisma.user.findMany({ where: { email } });

    if (usersWithEmail.length === 1) {
      const existingUser = usersWithEmail[0];
      
      // Security check: Only link existing account if the Clerk email is verified
      if (!isVerified) {
        console.warn(`[AUTH] Refusing to link existing User ${existingUser.id} to unverified Clerk email ${email}`);
        return null;
      }

      if (existingUser.clerkId && existingUser.clerkId !== clerkId) {
        console.log(`[AUTH] Re-linking User ${existingUser.id} from old Clerk ID to current Clerk ID.`);
      }

      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: { clerkId },
      });
      return user;
    } else if (usersWithEmail.length > 1) {
      console.error("[AUTH] Conflict: Multiple users found with same email.");
      return null;
    } else {
      // 5. Create new Prisma User
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name: clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : email.split('@')[0],
        },
      });
      return user;
    }
  } catch (err: any) {
    console.error("[AUTH_SYNC_DATABASE_ERROR] Database query failed during user synchronization:", err?.message || err);
    return null;
  }
});
