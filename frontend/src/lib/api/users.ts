import { apiRequest } from "@/lib/api/client";
import type { User } from "@/types/user";

export interface UpdateProfilePayload {
  name?: string;
  avatar?: string;
  currency?: string;
  timezone?: string;
  notificationPreferences?: Partial<User["notificationPreferences"]>;
}

export const usersApi = {
  async getMe(): Promise<User> {
    const { user } = await apiRequest<{ user: User }>("/users/me");
    return user;
  },

  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    const { user } = await apiRequest<{ user: User }>("/users/me", { method: "PATCH", body: payload });
    return user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiRequest<void>("/users/me/change-password", {
      method: "POST",
      body: { currentPassword, newPassword }
    });
  },

  async search(query: string): Promise<User[]> {
    const { users } = await apiRequest<{ users: User[] }>("/users/search", { query: { q: query } });
    return users;
  }
};
