import { ClientSession, FilterQuery, Types } from "mongoose";
import { Settlement, ISettlement } from "../models/Settlement";

export interface SettlementListFilter {
  groupId?: string;
  userId?: string; // either fromUser or toUser
}

export const settlementRepository = {
  async create(data: Partial<ISettlement>, session?: ClientSession): Promise<ISettlement> {
    const [settlement] = await Settlement.create([data], { session });
    return settlement;
  },

  async findById(settlementId: string): Promise<ISettlement | null> {
    if (!Types.ObjectId.isValid(settlementId)) return null;
    return Settlement.findById(settlementId);
  },

  async deleteById(settlementId: string, session?: ClientSession): Promise<void> {
    await Settlement.findByIdAndDelete(settlementId, { session });
  },

  async listByGroup(groupId: string): Promise<ISettlement[]> {
    return Settlement.find({ groupId }).sort({ date: -1 });
  },

  async list(
    filter: SettlementListFilter,
    skip: number,
    limit: number
  ): Promise<{ items: ISettlement[]; total: number }> {
    const query: FilterQuery<ISettlement> = {};
    if (filter.groupId) query.groupId = filter.groupId;
    if (filter.userId) {
      query.$or = [{ fromUser: filter.userId }, { toUser: filter.userId }];
    }

    const [items, total] = await Promise.all([
      Settlement.find(query).sort({ date: -1 }).skip(skip).limit(limit),
      Settlement.countDocuments(query)
    ]);

    return { items, total };
  },

  async searchByGroup(groupIds: string[], limit = 10): Promise<ISettlement[]> {
    return Settlement.find({ groupId: { $in: groupIds } })
      .sort({ date: -1 })
      .limit(limit);
  }
};
