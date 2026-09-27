import { z } from "zod";
import { objectIdSchema } from "./common";

export const createInvitationSchema = z.object({
  params: z.object({ groupId: objectIdSchema }),
  body: z.object({
    email: z.string().trim().email()
  })
});

export const respondInvitationSchema = z.object({
  params: z.object({ token: z.string().min(1) }),
  body: z.object({
    action: z.enum(["ACCEPT", "DECLINE"])
  })
});

export const listInvitationsQuerySchema = z.object({
  query: z.object({
    group: objectIdSchema.optional(),
    status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "EXPIRED"]).optional()
  })
});
