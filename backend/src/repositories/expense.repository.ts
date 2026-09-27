import { ClientSession, FilterQuery, Types } from "mongoose";
import { Expense, IExpense } from "../models/Expense";
import { ExpenseParticipant, IExpenseParticipant } from "../models/ExpenseParticipant";

export interface ExpenseListFilter {
  groupId?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  paidBy?: string;
  participantUserId?: string;
}

export const expenseRepository = {
  async create(data: Partial<IExpense>, session?: ClientSession): Promise<IExpense> {
    const [expense] = await Expense.create([data], { session });
    return expense;
  },

  async findById(expenseId: string): Promise<IExpense | null> {
    if (!Types.ObjectId.isValid(expenseId)) return null;
    return Expense.findOne({ _id: expenseId, deletedAt: null });
  },

  async updateById(
    expenseId: string,
    data: Partial<IExpense>,
    session?: ClientSession
  ): Promise<IExpense | null> {
    return Expense.findByIdAndUpdate(expenseId, data, { new: true, runValidators: true, session });
  },

  async softDelete(expenseId: string, session?: ClientSession): Promise<void> {
    await Expense.findByIdAndUpdate(expenseId, { deletedAt: new Date() }, { session });
  },

  async list(
    filter: ExpenseListFilter,
    skip: number,
    limit: number
  ): Promise<{ items: IExpense[]; total: number }> {
    const query: FilterQuery<IExpense> = { deletedAt: null };
    if (filter.groupId) query.groupId = filter.groupId;
    if (filter.category) query.category = filter.category;
    if (filter.paidBy) query.paidBy = filter.paidBy;
    if (filter.dateFrom || filter.dateTo) {
      query.date = {};
      if (filter.dateFrom) query.date.$gte = filter.dateFrom;
      if (filter.dateTo) query.date.$lte = filter.dateTo;
    }

    let expenseIdsForParticipant: Types.ObjectId[] | undefined;
    if (filter.participantUserId) {
      const rows = await ExpenseParticipant.find({ userId: filter.participantUserId }).select(
        "expenseId"
      );
      expenseIdsForParticipant = rows.map((r) => r.expenseId);
      query._id = { $in: expenseIdsForParticipant };
    }

    const [items, total] = await Promise.all([
      Expense.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Expense.countDocuments(query)
    ]);

    return { items, total };
  },

  async searchByText(query: string, groupIds: string[], limit = 10): Promise<IExpense[]> {
    const regex = new RegExp(escapeRegex(query), "i");
    return Expense.find({
      deletedAt: null,
      groupId: { $in: groupIds },
      $or: [{ title: regex }, { description: regex }]
    }).limit(limit);
  },

  // --- Participants ---------------------------------------------------

  async setParticipants(
    expenseId: string,
    participants: { userId: string; shareAmount: number; percentage?: number }[],
    session?: ClientSession
  ): Promise<IExpenseParticipant[]> {
    await ExpenseParticipant.deleteMany({ expenseId }, { session });
    const docs = participants.map((p) => ({ expenseId, ...p }));
    return ExpenseParticipant.insertMany(docs, { session }) as unknown as Promise<IExpenseParticipant[]>;
  },

  async findParticipants(expenseId: string): Promise<IExpenseParticipant[]> {
    return ExpenseParticipant.find({ expenseId });
  },

  async findParticipantsForGroup(groupId: string): Promise<
    { expenseId: Types.ObjectId; userId: Types.ObjectId; shareAmount: number }[]
  > {
    const expenseIds = await Expense.find({ groupId, deletedAt: null }).select("_id");
    const ids = expenseIds.map((e) => e._id);
    return ExpenseParticipant.find({ expenseId: { $in: ids } }).select(
      "expenseId userId shareAmount"
    );
  },

  async deleteParticipants(expenseId: string, session?: ClientSession): Promise<void> {
    await ExpenseParticipant.deleteMany({ expenseId }, { session });
  },

  async listByGroup(groupId: string): Promise<IExpense[]> {
    return Expense.find({ groupId, deletedAt: null }).sort({ date: -1 });
  }
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
