import api from "./api";
import type { Role, User } from "@/types";

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  requiresVerification: boolean;
  email: string;
  user?: User;
}

export const authService = {
  async login(payload: { email: string; password: string }) {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },
  async register(payload: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: Role;
  }) {
    const { data } = await api.post<AuthResponse | RegisterResponse>("/auth/register", payload);
    return data;
  },
  async forgotPassword(payload: { email: string }) {
    const { data } = await api.post<{ message?: string }>("/auth/forgot-password", payload);
    return data;
  },
  async verifyOtp(payload: { email: string; otp: string }) {
    const { data } = await api.post<AuthResponse>("/auth/verify-otp", payload);
    return data;
  },
  async resendOtp(payload: { email: string; mode?: "verify" | "reset" }) {
    const { data } = await api.post<{ message?: string }>("/auth/resend-otp", payload);
    return data;
  },
  async me() {
    const { data } = await api.get<{ user: User }>("/auth/me");
    return data.user;
  },
};

export default authService;
