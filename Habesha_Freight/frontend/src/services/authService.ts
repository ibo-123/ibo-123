import { get, post, patch } from './api';
import type { AuthUser } from '../types/person2';

const TOKEN_KEY = 'hf_token';
const USER_KEY = 'hf_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function persistSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Login: POST /api/auth/login
 * Backend returns { success, data: { token, user } }
 * The post() helper unwraps to { token, user }
 */
export async function loginWithPhone(
  phone_number: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  const data = await post<{ token: string; user: AuthUser }>('/auth/login', {
    phone_number,
    password,
  });
  persistSession(data.token, data.user);
  return data;
}

/**
 * Fetch current user profile: GET /api/auth/me
 * Backend returns { success, data: User }
 * The get() helper unwraps to User
 */
export async function fetchCurrentUser(): Promise<AuthUser> {
  const user = await get<AuthUser>('/auth/me');
  persistSession(getStoredToken() ?? '', user);
  return user;
}

/**
 * Update profile: PATCH /api/auth/profile
 */
export async function updateUserProfile(data: {
  full_name?: string;
  email?: string;
}): Promise<AuthUser> {
  const user = await patch<AuthUser>('/auth/profile', data);
  const token = getStoredToken();
  if (token) persistSession(token, user);
  return user;
}

export async function logoutUser(): Promise<void> {
  try {
    await post('/auth/logout', undefined);
  } finally {
    clearSession();
  }
}
