"use server";

import { getSession, requireAuth } from "@/lib/auth/session";
import { prisma } from "../db";
import { getOrCreateCurrentUser } from "./user";

export async function getUserGroups() {
  const session = await getSession();
  if (!session?.userId) return [];

  const dbUser = await getOrCreateCurrentUser();
  if (!dbUser) return [];

  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId: dbUser.id },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      members: m.group.members.map((mem) => ({
        userId: mem.user.id,
        name: mem.user.name,
        email: mem.user.email,
        role: mem.role,
        joinedAt: mem.createdAt.toISOString(),
      })),
      createdAt: m.group.createdAt.toISOString(),
      updatedAt: m.group.updatedAt.toISOString(),
    }));
  } catch (err: any) {
    console.error("[GET_USER_GROUPS_DB_ERROR]", err?.message || err);
    return [];
  }
}

export async function createGroup(payload: { name: string; description?: string; currency?: string }) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  if (!payload.name || !payload.name.trim()) {
    throw new Error("Group name is required");
  }

  const group = await prisma.group.create({
    data: {
      name: payload.name.trim(),
      members: {
        create: {
          userId: dbUser.id,
          role: "OWNER",
        },
      },
    },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  return {
    id: group.id,
    name: group.name,
    members: group.members.map((mem) => ({
      userId: mem.user.id,
      name: mem.user.name,
      email: mem.user.email,
      role: mem.role,
      joinedAt: mem.createdAt.toISOString(),
    })),
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

export async function updateGroup(groupId: string, payload: { name?: string; description?: string }) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: dbUser.id },
  });
  if (!membership) throw new Error("Forbidden: You are not a member of this group");

  return prisma.group.update({
    where: { id: groupId },
    data: {
      name: payload.name ? payload.name.trim() : undefined,
    },
  });
}

export async function deleteGroup(groupId: string) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: dbUser.id },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "owner")) {
    throw new Error("Forbidden: Only the group owner can delete the group");
  }

  return prisma.group.delete({ where: { id: groupId } });
}

export async function addGroupMember(groupId: string, email: string, role: string = "MEMBER") {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  // Authorization check: Verify caller is a member of the group
  const callerMembership = await prisma.groupMember.findFirst({
    where: { groupId, userId: dbUser.id },
  });
  if (!callerMembership) throw new Error("Forbidden: You are not a member of this group");

  const normalizedEmail = email.toLowerCase().trim();
  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    throw new Error("Please enter a valid email address");
  }

  // Find user by email or create a placeholder user so they can participate immediately
  let targetUser = await prisma.user.findFirst({ where: { email: normalizedEmail } });
  if (!targetUser) {
    targetUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
      },
    });
  }

  // Check if target user is already in the group
  const existingMembership = await prisma.groupMember.findFirst({
    where: { groupId, userId: targetUser.id },
  });
  if (existingMembership) {
    return existingMembership;
  }

  return prisma.groupMember.create({
    data: {
      groupId,
      userId: targetUser.id,
      role: role.toUpperCase(),
    },
  });
}

export async function removeGroupMember(groupId: string, memberUserId: string) {
  const { userId } = await requireAuth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const callerMembership = await prisma.groupMember.findFirst({
    where: { groupId, userId: dbUser.id },
  });
  if (!callerMembership) throw new Error("Forbidden");

  // Caller must be OWNER, ADMIN, or removing themselves
  const isSelf = memberUserId === dbUser.id;
  const isOwnerOrAdmin =
    callerMembership.role === "OWNER" ||
    callerMembership.role === "owner" ||
    callerMembership.role === "ADMIN" ||
    callerMembership.role === "admin";

  if (!isSelf && !isOwnerOrAdmin) {
    throw new Error("Forbidden: Only group admins or the member themselves can leave/remove");
  }

  return prisma.groupMember.deleteMany({
    where: { groupId, userId: memberUserId },
  });
}
