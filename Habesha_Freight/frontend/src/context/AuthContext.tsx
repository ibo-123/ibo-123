
import { createContext, ReactNode, useState, useEffect, useCallback, useContext } from 'react';
import { get, post } from '../services/api';

export interface User {
  id: string;
  full_name: string;
  phone_number?: string;
  email: string;
  role: 'SHIPPER' | 'DRIVER' | 'FLEET_OWNER' | 'ADMIN';
  is_verified: boolean;
  status: string;
  kyc_status?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (payload: FormData | Record<string, any>) => Promise<{ user?: any }>;
  verifyOtp: (identifier: string, otpCode: string) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('hf_user');
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hf_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const userData = await get<User>('/auth/me');
      if (userData) {
        setUser(userData);
        localStorage.setItem('hf_user', JSON.stringify(userData));
      }
    } catch {
      localStorage.removeItem('hf_token');
      localStorage.removeItem('hf_user');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [token, fetchUserProfile]);

  const login = async (identifier: string, password: string): Promise<User> => {
    const isEmail = identifier.includes('@');
    const body = isEmail ? { email: identifier, password } : { phone_number: identifier, password };
    const data = await post<{ user: User; token: string }>('/auth/login', body);
    const authToken = data.token;
    localStorage.setItem('hf_token', authToken);
    localStorage.setItem('hf_user', JSON.stringify(data.user));
    setToken(authToken);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload: FormData | Record<string, any>) => {
    let data: { user?: any; token?: string };
    if (payload instanceof FormData) {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const token = localStorage.getItem('hf_token');
      const response = await fetch(`${apiBase}/auth/register`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: payload,
      });
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.message || 'Registration failed.');
      }
      data = json.data || json;
    } else {
      data = await post<{ user?: any; token?: string }>('/auth/register', payload);
    }
    if (data.token && data.user) {
      localStorage.setItem('hf_token', data.token);
      localStorage.setItem('hf_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    }
    return data;
  };

  const verifyOtp = async (identifier: string, otpCode: string): Promise<User> => {
    const isEmail = identifier.includes('@');
    const body = isEmail
      ? { email: identifier, otp_code: otpCode }
      : { phone_number: identifier, otp_code: otpCode };
    const data = await post<{ user: User; token: string }>('/auth/verify-otp', body);
    const authToken = data.token;
    localStorage.setItem('hf_token', authToken);
    localStorage.setItem('hf_user', JSON.stringify(data.user));
    setToken(authToken);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hf_token');
    localStorage.removeItem('hf_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}