import { Types } from "mongoose";
import { settlementRepository, SettlementListFilter } from "../repositories/settlement.repository";
import { groupRepository } from "../repositories/group.repository";
import { assertGroupRole } from "../middleware/role.middleware";
import { NotFoundError, UnauthorizedError, ValidationError } from "../utils/errors";
import { CreateSettlementInput, SettlementFilters } from "../types/settlement.types";
import { ISettlement } from "../models/Settlement";
import { activityService } from "./activity.service";
import { notificationService } from "./notification.service";
import { calculateGroupBalances } from "./balance.service";
import { withTransaction } from "../utils/transaction";
import { parsePagination, buildPaginationMeta, PaginationMeta } from "../utils/pagination";
import { logger } from "../config/logger";

export const settlementService = {
  async createSettlement(actorId: string, input: CreateSettlementInput): Promise<ISettlement> {
    const group = await groupRepository.findById(input.groupId);
    if (!group) throw new NotFoundError("Group");

    const role = await assertGroupRole(input.groupId, actorId, ["OWNER", "ADMIN", "MEMBER"]);

    // MEMBERs may only record settlements they are personally a party to;
    // ADMIN/OWNER may record a settlement on behalf of any two members
    // (e.g. reconciling cash payments made outside the app).
    if (role === "MEMBER" && actorId !== input.fromUser && actorId !== input.toUser) {
      throw new UnauthorizedError("You can only create settlements you are a party to");
    }

    const fromMembership = await groupRepository.findMembership(input.groupId, input.fromUser);
    const toMembership = await groupRepository.findMembership(input.groupId, input.toUser);
    if (!fromMembership || !toMembership) {
      throw new ValidationError("Both users must belong to the group");
    }

    if (input.fromUser === input.toUser) {
      throw new ValidationError("fromUser and toUser must be different");
    }
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new ValidationError("Settlement amount must be a positive integer (minor currency units)");
    }

    const settlement = await withTransaction((session) =>
      settlementRepository.create(
        {
          groupId: new Types.ObjectId(input.groupId) as unknown as ISettlement["groupId"],
          fromUser: new Types.ObjectId(input.fromUser) as unknown as ISettlement["fromUser"],
          toUser: new Types.ObjectId(input.toUser) as unknown as ISettlement["toUser"],
          amount: input.amount,
          currency: input.currency ?? group.currency,
          paymentMethod: input.paymentMethod ?? "CASH",
          note: input.note,
          date: input.date ? new Date(input.date) : new Date(),
          createdBy: new Types.ObjectId(actorId) as unknown as ISettlement["createdBy"]
        },
        session
      )
    );

    await activityService.record(input.groupId, actorId, "settlement_created", {
      settlementId: settlement._id.toString(),
      amount: input.amount
    });

    await notificationService.notifyMany(
      [
        {
          userId: input.fromUser,
          type: "SETTLEMENT_CREATED" as const,
          title: "Settlement recorded",
          message: `A payment of ${input.amount} (minor units) was recorded in ${group.name}.`,
          relatedGroupId: input.groupId,
          relatedSettlementId: settlement._id.toString()
        },
        {
          userId: input.toUser,
          type: "SETTLEMENT_RECEIVED" as const,
          title: "Payment received",
          message: `You were recorded as receiving ${input.amount} (minor units) in ${group.name}.`,
          relatedGroupId: input.groupId,
          relatedSettlementId: settlement._id.toString()
        }
      ].filter((n) => n.userId !== actorId || true) // both parties are notified regardless of who created it
    );

    // Defensive sanity check: recalculating balances after a settlement
    // should never violate the sum-to-zero invariant, since a settlement
    // moves an equal amount between exactly two members. We recompute
    // here purely as a safety net and to warm/validate derived state -
    // this never blocks the response since the write already committed
    // atomically and settlements cannot mathematically break the invariant.
    try {
      await calculateGroupBalances(input.groupId, actorId);
    } catch (err) {
      logger.error("Post-settlement balance invariant check failed", {
        groupId: input.groupId,
        message: err instanceof Error ? err.message : String(err)
      });
    }

    return settlement;
  },

  async getSettlement(settlementId: string, userId: string): Promise<ISettlement> {
    const settlement = await settlementRepository.findById(settlementId);
    if (!settlement) throw new NotFoundError("Settlement");

    await assertGroupRole(settlement.groupId.toString(), userId, ["OWNER", "ADMIN", "MEMBER"]);
    return settlement;
  },

  async listSettlements(
    userId: string,
    filters: SettlementFilters
  ): Promise<{ items: ISettlement[]; pagination: PaginationMeta }> {
    if (filters.group) {
      await assertGroupRole(filters.group, userId, ["OWNER", "ADMIN", "MEMBER"]);
    }

    const { page, limit, skip } = parsePagination(filters as unknown as Record<string, unknown>);

    const repoFilter: SettlementListFilter = {
      groupId: filters.group,
      userId: filters.userId
    };

    if (!filters.group) {
      const memberships = await groupRepository.listGroupsForUser(userId);
      const groupIds = memberships.map((m) => m.groupId.toString());
      if (groupIds.length === 0) return { items: [], pagination: buildPaginationMeta(page, limit, 0) };

      const { items, total } = await settlementRepository.list(repoFilter, skip, limit);
      const filtered = items.filter((s) => groupIds.includes(s.groupId.toString()));
      return { items: filtered, pagination: buildPaginationMeta(page, limit, total) };
    }

    const { items, total } = await settlementRepository.list(repoFilter, skip, limit);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  },

  async deleteSettlement(settlementId: string, actorId: string): Promise<void> {
    const settlement = await settlementRepository.findById(settlementId);
    if (!settlement) throw new NotFoundError("Settlement");

    const role = await assertGroupRole(settlement.groupId.toString(), actorId, ["OWNER", "ADMIN", "MEMBER"]);
    const isCreator = settlement.createdBy.toString() === actorId;
    if (role === "MEMBER" && !isCreator) {
      throw new UnauthorizedError("Only the settlement creator or a group admin can delete this settlement");
    }

    await withTransaction((session) => settlementRepository.deleteById(settlementId, session));

    await activityService.record(settlement.groupId.toString(), actorId, "settlement_deleted", {
      settlementId
    });
  }
};
