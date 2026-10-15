import {apiClient} from './api';
import type { Tournament, Participant, Bracket, LeaderboardEntry } from '../types';

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

  async leaderboard(tournamentId: string): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/leaderboard`);
    return response.data;
  },

  // Participant endpoints
  async getMyTournaments(): Promise<{ tournaments: (Participant & { tournament: Tournament })[] }> {
    const response = await apiClient.get('/tournaments/my-tournaments');
    return response.data;
  },

  async getMyStatus(tournamentId: string): Promise<{ participant: Participant }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/my-status`);
    return response.data;
  },

  // Admin endpoints
  async start(tournamentId: string): Promise<{ success: boolean; message: string; tournament?: Tournament }> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/start`);
    return response.data;
  },

  async advance(tournamentId: string, stage: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/advance`, { stage });
    return response.data;
  },

  async create(data: Partial<Tournament>): Promise<{ tournament: Tournament }> {
    const response = await apiClient.post('/admin/tournaments', data);
    return response.data;
  },

  async update(tournamentId: string, data: Partial<Tournament>): Promise<{ tournament: Tournament }> {
    const response = await apiClient.patch(`/admin/tournaments/${tournamentId}`, data);
    return response.data;
  },

  // Participant registration
  async join(tournamentId: string): Promise<{ success: boolean; message: string; participant: Participant }> {
    const response = await apiClient.post(`/tournaments/${tournamentId}/join`);
    return response.data;
  },

  // Admin participant management
  async getParticipants(tournamentId: string): Promise<{ participants: Participant[] }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/participants`);
    return response.data;
  },

  async approveParticipant(tournamentId: string, participantId: string): Promise<{ participant: Participant }> {
    const response = await apiClient.patch(`/tournaments/${tournamentId}/participants/${participantId}/approve`);
    return response.data;
  },

  async rejectParticipant(tournamentId: string, participantId: string): Promise<{ participant: Participant }> {
    const response = await apiClient.patch(`/tournaments/${tournamentId}/participants/${participantId}/reject`);
    return response.data;
  },

  async updateParticipant(tournamentId: string, participantId: string, data: Partial<Participant>): Promise<{ participant: Participant }> {
    const response = await apiClient.patch(`/admin/tournaments/${tournamentId}/participants/${participantId}`, data);
    return response.data;
  },

  // Admin standings/bracket
  async getStandings(tournamentId: string): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/standings`);
    return response.data;
  },

  async getBracket(tournamentId: string): Promise<{ bracket: Bracket }> {
    const response = await apiClient.get(`/admin/tournaments/${tournamentId}/bracket`);
    return response.data;
  },
};