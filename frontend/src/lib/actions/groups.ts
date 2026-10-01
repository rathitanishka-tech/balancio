"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "../db";
import { getOrCreateCurrentUser } from "./user";

export async function getUserGroups() {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

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
}

export async function createGroup(payload: { name: string; description?: string; currency?: string }) {
  const { userId } = auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getOrCreateCurrentUser();

  const group = await prisma.group.create({
    data: {
      name: payload.name,
      members: {
        create: {
          userId: dbUser.id,
          role: "OWNER",
        },
      },
    },
    include: {
      members: {
        include: { user: true }
      }
    }
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
  return prisma.group.update({ where: { id: groupId }, data: payload });
}
export async function deleteGroup(groupId: string) {
  return prisma.group.delete({ where: { id: groupId } });
}
export async function addGroupMember(groupId: string, email: string, role: string = "MEMBER") {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) throw new Error("User not found with this email");
  return prisma.groupMember.create({ data: { groupId, userId: user.id, role } });
}
export async function removeGroupMember(groupId: string, memberUserId: string) {
  return prisma.groupMember.deleteMany({ where: { groupId, userId: memberUserId } });
}

