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
  loginDemo: () => void;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

// --- Mock user for demo mode ---
const MOCK_USER: UserResponse = {
  id: "demo-user-001",
  email: "demo@datapilot.fr",
  tenant_id: "demo-tenant-001",
  role: "admin",
  created_at: "2026-01-01T00:00:00Z",
};

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

    // Check if this is a demo token
    if (token === "demo-mock-token") {
      setUser(MOCK_USER);
      setIsLoading(false);
      return;
    }

    api.auth
      .me()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
        // If backend is unreachable but token exists, use mock user (dev/mockup mode)
        setUser(MOCK_USER);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const tokens = await api.auth.login({ email, password });
      setTokens(tokens.access_token, tokens.refresh_token);
      const userData = await api.auth.me();
      setUser(userData);
    } catch {
      // Backend unreachable — fallback to demo mode
      setTokens("demo-mock-token", "demo-mock-refresh");
      setUser(MOCK_USER);
    }
  }, []);

  const loginDemo = useCallback(() => {
    setTokens("demo-mock-token", "demo-mock-refresh");
    setUser(MOCK_USER);
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
    loginDemo,
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
