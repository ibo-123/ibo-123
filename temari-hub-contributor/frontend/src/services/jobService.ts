import type { ContributorJob, Job, JobWriteInput } from '../types';
import { apiRequest } from './api';

// Admin
export function listJobs() {
  return apiRequest<{ jobs: Job[] }>('/api/jobs');
}

export function getJob(id: string) {
  return apiRequest<{ job: Job }>(`/api/jobs/${id}`);
}

export function createJob(input: JobWriteInput) {
  return apiRequest<{ job: Job }>('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateJob(id: string, input: JobWriteInput) {
  return apiRequest<{ job: Job }>(`/api/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function cancelJob(id: string) {
  return apiRequest<{ job: Job }>(`/api/jobs/${id}/cancel`, { method: 'PATCH' });
}

// Contributor
export function listMyJobs() {
  return apiRequest<{ jobs: ContributorJob[] }>('/api/contributor/jobs');
}

export function getMyJob(id: string) {
  return apiRequest<{ job: ContributorJob }>(`/api/contributor/jobs/${id}`);
}
