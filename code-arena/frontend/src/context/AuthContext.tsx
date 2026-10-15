// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type { User, LoginCredentials, RegisterData } from "../types";
import { authApi } from "../services/authApi";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "code-arena-token";
const USER_KEY = "code-arena-user";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await authApi.me();
        setUser(response.user);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [clearAuth]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    try {
      setError(null);
      setLoading(true);
      const response = await authApi.login(credentials);
      localStorage.setItem(TOKEN_KEY, response.token);
      setUser(response.user);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      return response.user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<User> => {
    try {
      setError(null);
      setLoading(true);
      const response = await authApi.register(data);
      localStorage.setItem(TOKEN_KEY, response.token);
      setUser(response.user);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      return response.user;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {}
    clearAuth();
    setUser(null);
    setError(null);
  }, [clearAuth]);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authApi.me();
      setUser(response.user);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to refresh";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
      clearError,
      isAuthenticated: !!user,
      isAdmin: user?.role === "ADMIN",
    }),
    [user, loading, error, login, register, logout, refreshUser, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
