import { z } from "zod";
import { objectIdSchema } from "./common";

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Group name is required").max(120),
    description: z.string().trim().max(500).optional(),
    image: z.string().url().optional().or(z.literal("")),
    currency: z.string().length(3).optional()
  })
});

export const updateGroupSchema = z.object({
  params: z.object({ groupId: objectIdSchema }),
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).optional(),
    image: z.string().url().optional().or(z.literal("")),
    currency: z.string().length(3).optional()
  })
});

export const groupIdParamSchema = z.object({
  params: z.object({ groupId: objectIdSchema })
});

export const addMemberSchema = z.object({
  params: z.object({ groupId: objectIdSchema }),
  body: z.object({
    email: z.string().trim().email(),
    role: z.enum(["ADMIN", "MEMBER"]).optional()
  })
});

export const removeMemberSchema = z.object({
  params: z.object({ groupId: objectIdSchema, userId: objectIdSchema })
});

export const updateMemberRoleSchema = z.object({
  params: z.object({ groupId: objectIdSchema, userId: objectIdSchema }),
  body: z.object({
    role: z.enum(["OWNER", "ADMIN", "MEMBER"])
  })
});
