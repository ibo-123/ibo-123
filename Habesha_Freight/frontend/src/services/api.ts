import axios, { AxiosError, AxiosResponse } from 'axios';

// Base URL from Vite environment variables
const API_URL = import.meta.env.VITE_API_URL || '/api';

// ── Raw Axios instance (used internally and exposed as axiosInstance) ──────
export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// ── Request interceptor: attach Bearer token ─────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token =
    localStorage.getItem('hf_token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: reject on HTTP errors ───────────────────────────
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const data = (error.response?.data as Record<string, unknown>) || {};
    const msg =
      (data.message as string) ||
      error.message ||
      'API Request failed';
    const enriched = new Error(msg) as Error & Record<string, unknown>;
    // Preserve backend flags (e.g. requires_otp_verification) for login redirect
    for (const key of Object.keys(data)) {
      if (key !== 'message') enriched[key] = data[key];
    }
    enriched.status = error.response?.status;
    return Promise.reject(enriched);
  }
);

// ────────────────────────────────────────────────────────────────────────────
// Convenience helpers
//   Each helper calls the backend and unwraps the standard envelope:
//     { success: true, message: "...", data: <payload> }
//   → returns <payload> directly
// ────────────────────────────────────────────────────────────────────────────

export const get = async <T>(endpoint: string, params?: Record<string, any> | boolean): Promise<T> => {
  const axiosParams = typeof params === 'object' && params !== null ? params : undefined;
  const res = await axiosInstance.get(endpoint, { params: axiosParams });
  const body = res.data as any;
  // Unwrap { success, data } envelope if present; otherwise return body directly
  return body?.data !== undefined ? body.data : body;
};

export const post = async <T>(endpoint: string, body?: unknown): Promise<T> => {
  const res = await axiosInstance.post(endpoint, body);
  const resBody = res.data as any;
  return resBody?.data !== undefined ? resBody.data : resBody;
};

export const patch = async <T>(endpoint: string, body?: unknown): Promise<T> => {
  const res = await axiosInstance.patch(endpoint, body);
  const resBody = res.data as any;
  return resBody?.data !== undefined ? resBody.data : resBody;
};

export const put = async <T>(endpoint: string, body?: unknown): Promise<T> => {
  const res = await axiosInstance.put(endpoint, body);
  const resBody = res.data as any;
  return resBody?.data !== undefined ? resBody.data : resBody;
};

export const del = async <T>(endpoint: string): Promise<T> => {
  const res = await axiosInstance.delete(endpoint);
  const resBody = res.data as any;
  return resBody?.data !== undefined ? resBody.data : resBody;
};

// ────────────────────────────────────────────────────────────────────────────
// Backward-compatible "api" object
//   Old code does: api.get<T>('/path') and expects the unwrapped payload.
//   We proxy these through our helpers so that migration is transparent.
// ────────────────────────────────────────────────────────────────────────────
export const api = {
  get: <T>(endpoint: string, params?: Record<string, any> | boolean): Promise<T> =>
    get<T>(endpoint, params),
  post: <T>(endpoint: string, body?: unknown, _options?: unknown): Promise<T> =>
    post<T>(endpoint, body),
  put: <T>(endpoint: string, body?: unknown, _options?: unknown): Promise<T> =>
    put<T>(endpoint, body),
  patch: <T>(endpoint: string, body?: unknown, _options?: unknown): Promise<T> =>
    patch<T>(endpoint, body),
  delete: <T>(endpoint: string): Promise<T> =>
    del<T>(endpoint),
};

export default api;
