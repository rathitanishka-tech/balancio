import { AUTH_TOKEN_KEY } from "@/lib/utils/constants";

/**
 * Thin wrapper around localStorage for the JWT. Centralized here so that
 * (a) every read/write goes through one place, and (b) swapping to an
 * httpOnly-cookie-based session later only means changing this file.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}
