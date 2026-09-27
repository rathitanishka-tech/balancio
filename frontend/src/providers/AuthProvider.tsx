"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi } from "@/lib/api/auth";
import { getToken, setToken, clearToken } from "@/lib/auth/token";
import { registerUnauthorizedHandler } from "@/lib/api/client";
import type { User } from "@/types/user";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getToken();
      if (!token) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }
      try {
        const me = await authApi.me();
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        clearToken();
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null);
      setStatus("unauthenticated");
    });
  }, []);

  async function login(email: string, password: string) {
    const { user: loggedInUser, token } = await authApi.login({ email, password });
    setToken(token);
    setUser(loggedInUser);
    setStatus("authenticated");
  }

  async function register(name: string, email: string, password: string) {
    const { user: newUser, token } = await authApi.register({ name, email, password });
    setToken(token);
    setUser(newUser);
    setStatus("authenticated");
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Best-effort - the client-side session is cleared regardless.
    }
    clearToken();
    setUser(null);
    setStatus("unauthenticated");
  }



  async function refreshUser() {
    const me = await authApi.me();
    setUser(me);
  }

  return (
    <AuthContext.Provider
      value={{ user, status, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within an AuthProvider");
  return ctx;
}
