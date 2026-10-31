import { getOrCreateCurrentUser, updateUserProfile } from "@/lib/actions/user";
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
    const user = await getOrCreateCurrentUser();
    return user as unknown as User;
  },

  async updateMe(payload: UpdateProfilePayload): Promise<User> {
    const user = await updateUserProfile({
      name: payload.name,
      avatar: payload.avatar,
    });
    return user as unknown as User;
  },

  async changePassword(_currentPassword: string, _newPassword: string): Promise<void> {
    // In Clerk-managed auth, password changes and MFA are handled via Clerk UserButton / Account Portal.
    return Promise.resolve();
  },

  async search(_query: string): Promise<User[]> {
    return [];
  }
};
