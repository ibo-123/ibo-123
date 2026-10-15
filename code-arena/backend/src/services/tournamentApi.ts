import apiClient from './api';
import type { Tournament, Participant, Bracket } from '../types';

export const tournamentApi = {
  async list(): Promise<{ tournaments: Tournament[] }> {
    const response = await apiClient.get('/tournaments');
    return response.data;
  },

  async get(id: string): Promise<{ tournament: Tournament }> {
    const response = await apiClient.get(`/tournaments/${id}`);
    return response.data;
  },

  async participants(tournamentId: string): Promise<{ participants: Participant[] }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/participants`);
    return response.data;
  },

  async groups(tournamentId: string): Promise<{ groups: Record<string, Participant[]> }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/groups`);
    return response.data;
  },

  async bracket(tournamentId: string): Promise<{ bracket: Bracket }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/bracket`);
    return response.data;
  },

  async start(tournamentId: string): Promise<any> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/start`);
    return response.data;
  },

  async advance(tournamentId: string, stage: string): Promise<any> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/advance`, { stage });
    return response.data;
  },
};
