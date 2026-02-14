"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, type UserResponse } from "@/lib/api";
import { setTokens, clearTokens, getAccessToken } from "@/lib/auth";

// --- Types ---

interface AuthContextValue {
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// --- Context ---

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// --- Provider ---

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate user from existing token on mount
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api.auth
      .me()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api.auth.login({ email, password });
    setTokens(tokens.access_token, tokens.refresh_token);
    const userData = await api.auth.me();
    setUser(userData);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const tenantId = crypto.randomUUID();
    await api.auth.register({ email, password, tenant_id: tenantId });
    // Auto-login after registration
    const tokens = await api.auth.login({ email, password });
    setTokens(tokens.access_token, tokens.refresh_token);
    const userData = await api.auth.me();
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- Hook ---

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
