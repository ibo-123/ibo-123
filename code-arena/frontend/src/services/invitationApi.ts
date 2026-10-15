import {apiClient} from './api';
import type { Invitation } from '../types';

export const invitationApi = {
  async getMyInvitations(status?: string): Promise<{ invitations: Invitation[] }> {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/my/invitations${params}`);
    return response.data;
  },

  async respondToInvitation(invitationId: string, status: 'ACCEPTED' | 'DECLINED'): Promise<{ invitation: Invitation }> {
    const response = await apiClient.patch(`/invitations/${invitationId}`, { status });
    return response.data;
  },

  // Admin endpoint
  async createInvitations(contestId: string, participantIds: string[]): Promise<{ invitations: Invitation[] }> {
    const response = await apiClient.post(`/admin/contests/${contestId}/invitations`, { participantIds });
    return response.data;
  },
};
