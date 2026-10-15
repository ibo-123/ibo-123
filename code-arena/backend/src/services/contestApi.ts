import apiClient from './api';
import type { Contest, LeaderboardEntry } from '../types';

export const contestApi = {
  async list(tournamentId: string): Promise<{ contests: Contest[] }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/contests`);
    return response.data;
  },

  async get(tournamentId: string, contestId: string): Promise<{ contest: Contest }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/contests/${contestId}`);
    return response.data;
  },

  async leaderboard(tournamentId: string, contestId: string): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/contests/${contestId}/leaderboard`);
    return response.data;
  },

  async validateCodeforces(contestId: number): Promise<any> {
    const response = await apiClient.post(`/admin/contests/validate/${contestId}`);
    return response.data;
  },

  async create(
    tournamentId: string,
    data: {
      name: string;
      stage: string;
      group?: string;
      matchNumber?: number;
      codeforcesContestId: number;
      codeforcesUrl: string;
      startTime: string;
      durationMinutes: number;
    }
  ): Promise<{ contest: Contest }> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/contests`, data);
    return response.data;
  },

  async sync(tournamentId: string, contestId: string): Promise<any> {
    const response = await apiClient.post(`/admin/tournaments/${tournamentId}/contests/${contestId}/sync`);
    return response.data;
  },
};
