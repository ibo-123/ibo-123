import apiClient from './api';
import type { User, LoginCredentials, RegisterData } from '../types';

export const authApi = {
  async login(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  async register(data: RegisterData): Promise<{ token: string; user: User }> {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  async me(): Promise<{ user: User }> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    }
  },
};
