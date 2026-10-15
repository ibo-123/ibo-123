// frontend/src/services/contestApi.ts
import { apiClient } from './api';
import type { Contest, LeaderboardEntry, Result, VideoSubmission } from '../types';

export const contestApi = {
  /**
   * Public / participant contest listing (published only).
   * Backend: GET /tournaments/:tournamentId/contests
   */
  async list(tournamentId: string): Promise<{ contests: Contest[] }> {
    const response = await apiClient.get(`/tournaments/${tournamentId}/contests`);
    return response.data;
  },

  /**
   * Participant's group-aware visible contests (published only).
   * Backend: GET /contests/tournaments/:tournamentId/my-contests
   */
  async getMyContests(
    tournamentId: string,
  ): Promise<{ contests: Contest[]; count: number; participant?: { group: string | null } }> {
    const response = await apiClient.get(
      `/contests/tournaments/${tournamentId}/my-contests`
    );
    return response.data;
  },

  async get(tournamentId: string, contestId: string): Promise<{ contest: Contest }> {
    const response = await apiClient.get(
      `/tournaments/${tournamentId}/contests/${contestId}`
    );
    return response.data;
  },

  async leaderboard(
    tournamentId: string,
    contestId: string,
  ): Promise<{ leaderboard: LeaderboardEntry[] }> {
    const response = await apiClient.get(
      `/tournaments/${tournamentId}/contests/${contestId}/leaderboard`
    );
    return response.data;
  },

  async results(
    tournamentId: string,
    contestId: string,
  ): Promise<{ results: Result[] }> {
    const response = await apiClient.get(
      `/tournaments/${tournamentId}/contests/${contestId}/results`
    );
    return response.data;
  },

  // ---------- VIDEO SUBMISSION (participant-facing) ----------
  async submitVideo(
    contestId: string,
    videoUrl: string,
    note?: string,
  ): Promise<{ submission: VideoSubmission }> {
    const response = await apiClient.post(`/contests/${contestId}/video-submission`, {
      videoUrl,
      note,
    });
    return response.data;
  },

  async getMyVideoSubmission(
    contestId: string,
  ): Promise<{ submission: VideoSubmission | null }> {
    const response = await apiClient.get(`/contests/${contestId}/video-submission`);
    return response.data;
  },

  // ---------- JOIN CONFIRMATION (participant-facing) ----------
  async confirmJoined(contestId: string): Promise<{
    success: boolean;
    message: string;
    confirmedAt: string;
  }> {
    const response = await apiClient.post(`/contests/${contestId}/confirm-joined`);
    return response.data;
  },

  async getMyParticipation(contestId: string): Promise<{
    success: boolean;
    registrationStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'NONE';
    confirmedJoined: boolean;
    canSubmitVideo: boolean;
  }> {
    const response = await apiClient.get(`/contests/${contestId}/my-participation`);
    return response.data;
  },

  // ---------- ADMIN VIDEO SUBMISSION ----------
  async getVideoSubmissions(
    contestId: string,
    status?: string,
  ): Promise<{ submissions: VideoSubmission[]; count?: number }> {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(
      `/admin/contests/${contestId}/video-submissions${params}`
    );
    return response.data;
  },

  async approveVideo(submissionId: string): Promise<{ submission: VideoSubmission }> {
    const response = await apiClient.patch(
      `/admin/video-submissions/${submissionId}/approve`
    );
    return response.data;
  },

  async rejectVideo(
    submissionId: string,
    reason?: string,
  ): Promise<{ submission: VideoSubmission }> {
    const response = await apiClient.patch(
      `/admin/video-submissions/${submissionId}/reject`,
      { reason: reason ?? '' }
    );
    return response.data;
  },

  async addPenalty(
    contestId: string,
    participantId: string,
    problemIndex: string,
    penalty: number,
  ): Promise<{ result: Result }> {
    const response = await apiClient.post(
      `/admin/contests/${contestId}/participants/${participantId}/penalty`,
      { problemIndex, penalty, type: 'set' }
    );
    return response.data;
  },

  async sync(
    tournamentId: string,
    contestId: string,
  ): Promise<{
    success: boolean;
    message: string;
    stats?: { total: number; matched: number; unmatched: number; updated: number };
    results?: Result[];
    unmatchedHandles?: string[];
  }> {
    const response = await apiClient.post(
      `/admin/tournaments/${tournamentId}/contests/${contestId}/sync`
    );
    return response.data;
  },
};