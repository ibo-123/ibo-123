import { apiRequest } from './api';
import type { LoginResult, User } from '../types';

export function login(email: string, password: string) {
  return apiRequest<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser() {
  return apiRequest<{ user: User }>('/api/auth/me');
}
