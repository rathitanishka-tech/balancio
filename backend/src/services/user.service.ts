import bcrypt from "bcrypt";
import { userRepository } from "../repositories/user.repository";
import { NotFoundError, UnauthenticatedError } from "../utils/errors";
import { IUser } from "../models/User";

export const userService = {
  async getById(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError("User");
    return user;
  },

  async updateProfile(userId: string, data: Partial<IUser>): Promise<IUser> {
    const user = await userRepository.updateById(userId, data);
    if (!user) throw new NotFoundError("User");
    return user;
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw new NotFoundError("User");

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new UnauthenticatedError("Current password is incorrect");

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
  },

  async searchUsers(query: string): Promise<IUser[]> {
    if (!query || query.trim().length === 0) return [];
    return userRepository.searchByNameOrEmail(query.trim());
  }
};
