import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { getApiUrl, TOKEN_STORAGE_KEY } from "@/lib/config";

function normalizeApiUrl(rawUrl: string): string {
  const url = rawUrl.replace(/\/+$/, "");
  if (url.toLowerCase().endsWith("/api")) {
    return url;
  }
  return `${url}/api`;
}

const baseURL = normalizeApiUrl(getApiUrl());

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
  // Allow sending cookies (httpOnly session cookies) when backend switches
  // to cookie-based auth. This is harmless for Bearer tokens stored in
  // localStorage and enables smoother compatibility with the backend CORS
  // configuration (which sets `credentials: true`).
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.localStorage.removeItem("habeshafreight.user");
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  const axiosError = error as AxiosError<{ message?: string; error?: string }>;
  if (axiosError?.response?.data?.message) return axiosError.response.data.message;
  if (axiosError?.response?.data?.error) return axiosError.response.data.error;
  if (axiosError?.code === "ERR_NETWORK")
    return "Cannot reach the HabeshaFreight API. Check VITE_API_URL and that the backend is running.";
  if (axiosError?.message) return axiosError.message;
  return fallback;
}

export function isNetworkError(error: unknown): boolean {
  const axiosError = error as AxiosError;
  return axiosError?.code === "ERR_NETWORK" || axiosError?.code === "ECONNABORTED";
}

export default api;
