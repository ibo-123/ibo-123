import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import authService from "@/services/authService";
import { apiErrorMessage, isNetworkError } from "@/services/api";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "@/lib/config";
import type { Role, User } from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  ready: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  offlineSession: boolean;
  login: (payload: { email: string; password: string; role?: Role }) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: Role;
  }) => Promise<{ user: User | null; requiresOtp: boolean }>;
  verifyOtp: (payload: {
    email: string;
    otp: string;
    mode?: "verify" | "reset";
    newPassword?: string;
  }) => Promise<User>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const ROLE_HOME: Record<Role, string> = {
  customer: "/customer",
  driver: "/driver",
  dispatcher: "/dispatcher",
  admin: "/admin",
};

function persist(token: string, user: User) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offlineSession, setOfflineSession] = useState(false);

  // Restore a persisted session after hydration (never during render/SSR).
  useEffect(() => {
    const storedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
        setToken(storedToken);
        setOfflineSession(storedToken.startsWith("preview."));
      } catch {
        window.localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  const finishAuth = useCallback((nextToken: string, nextUser: User, offline = false) => {
    persist(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
    setOfflineSession(offline);
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async ({ email, password, role }) => {
      setLoading(true);
      try {
        const res = await authService.login({ email, password });
        finishAuth(res.token, res.user);
        return res.user;
      } catch (error) {
        // Backend unavailable (no VITE_API_URL reachable): allow a clearly
        // labelled preview session so the UI stays explorable. Real data,
        // tracking and GPS streaming still require the backend.
        if (isNetworkError(error) && role) {
          const previewUser: User = {
            id: `preview-${role}`,
            name: email.split("@")[0] || "Preview user",
            email,
            role,
            status: "active",
          };
          finishAuth(`preview.${role}.${Date.now()}`, previewUser, true);
          toast.warning("API unreachable — signed in as a preview session", {
            description: "Live trips and GPS tracking need the HabeshaFreight backend running.",
          });
          return previewUser;
        }
        throw new Error(apiErrorMessage(error, "Unable to sign in"));
      } finally {
        setLoading(false);
      }
    },
    [finishAuth],
  );

  const register = useCallback<AuthContextValue["register"]>(async (payload) => {
    setLoading(true);
    try {
      const res = await authService.register(payload);
      if (res && "token" in res && res?.token && res?.user) {
        persist(res.token, res.user);
        setToken(res.token);
        setUser(res.user);
        return { user: res.user, requiresOtp: false };
      }
      return { user: null, requiresOtp: true };
    } catch (error) {
      if (isNetworkError(error)) {
        toast.warning("API unreachable — continuing to OTP step", {
          description: "Verification will complete once the backend is reachable.",
        });
        return { user: null, requiresOtp: true };
      }
      throw new Error(apiErrorMessage(error, "Unable to create the account"));
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback<AuthContextValue["verifyOtp"]>(
    async (payload) => {
      setLoading(true);
      try {
        const res = await authService.verifyOtp(payload);
        finishAuth(res.token, res.user);
        return res.user;
      } catch (error) {
        throw new Error(apiErrorMessage(error, "Invalid or expired code"));
      } finally {
        setLoading(false);
      }
    },
    [finishAuth],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setToken(null);
    setOfflineSession(false);
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      ready,
      loading,
      offlineSession,
      isAuthenticated: Boolean(user),
      login,
      register,
      verifyOtp,
      logout,
      updateUser,
    }),
    [user, token, ready, loading, offlineSession, login, register, verifyOtp, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
