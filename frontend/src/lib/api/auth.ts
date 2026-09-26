import { apiRequest } from "@/lib/api/client";
import type { User } from "@/types/user";
export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  currency?: string;
  timezone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}



export const authApi = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/register", { method: "POST", body: payload, skipAuth: true });
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/login", { method: "POST", body: payload, skipAuth: true });
  },

  async logout(): Promise<void> {
    await apiRequest<void>("/auth/logout", { method: "POST" });
  },

  async me(): Promise<User> {
    return apiRequest<User>("/auth/me");
  }


};
