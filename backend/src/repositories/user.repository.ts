import { Types } from "mongoose";
import { User, IUser } from "../models/User";

/**
 * All direct Mongoose/User model access is isolated here so the rest of
 * the app depends on this interface rather than Mongoose directly. This
 * is what would need to change if the database layer moves to
 * PostgreSQL + Prisma later.
 */
export const userRepository = {
  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  },

  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return User.findById(id);
  },

  async findByIdWithPassword(id: string | Types.ObjectId): Promise<IUser | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return User.findById(id).select("+passwordHash");
  },

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() });
  },

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
  },

  async findByIds(ids: (string | Types.ObjectId)[]): Promise<IUser[]> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    return User.find({ _id: { $in: validIds } });
  },

  async updateById(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  async searchByNameOrEmail(query: string, limit = 10): Promise<IUser[]> {
    const regex = new RegExp(escapeRegex(query), "i");
    return User.find({ $or: [{ name: regex }, { email: regex }] }).limit(limit);
  }
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
