"use client";

import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api";
import {
  clearAuth,
  getAuthMode,
  getStoredUser,
  saveAuth,
  saveKeycloakSession
} from "@/lib/auth";
import type { User } from "@/types/user";
import type { LoginResponseData } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL environment variable");
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrapAuth() {
      try {
        const storedUser = getStoredUser();

        if (storedUser) {
          setUser(storedUser);
          return;
        }

        // Restore delegated Keycloak session from cookie-based backend auth
        const response = await apiRequest<User>("/profile/me", {
          method: "GET"
        });

        if (response?.data) {
          saveKeycloakSession(response.data);
          setUser(response.data);
        }
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        setReady(true);
      }
    }

    void bootstrapAuth();
  }, []);

  async function login(username: string, password: string): Promise<User> {
    const response = await apiRequest<LoginResponseData>("/auth/login", {
      method: "POST",
      body: { username, password },
      useAuthHeader: false
    });

    saveAuth(response.data.token, response.data.user);
    setUser(response.data.user);

    return response.data.user;
  }

  async function logout() {
    const authMode = getAuthMode();

    if (authMode === "KEYCLOAK") {
      clearAuth();
      setUser(null);

      window.location.href = `${API_BASE_URL}/auth/keycloak/logout`;
      return;
    }

    clearAuth();
    setUser(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login,
      logout
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}