import type { ReviewDecision } from '../constants/templates';
import type { Submission, SubmissionItem } from '../types';
import { apiDownload, apiRequest } from './api';

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function getMySubmission(jobId: string) {
  return apiRequest<{ submission: Submission | null }>(`/api/contributor/jobs/${jobId}/submission`);
}

export function createSubmission(jobId: string, items?: SubmissionItem[], notes?: string) {
  return apiRequest<{ submission: Submission }>(`/api/contributor/jobs/${jobId}/submission`, {
    method: 'POST',
    body: JSON.stringify({ items, notes }),
  });
}

export function listMySubmissions() {
  return apiRequest<{ submissions: Submission[] }>('/api/contributor/submissions');
}

export function updateSubmission(id: string, input: { items: SubmissionItem[]; notes: string }) {
  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function submitSubmission(id: string) {
  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}/submit`, {
    method: 'POST',
  });
}

export function resubmitSubmission(id: string) {
  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}/resubmit`, {
    method: 'POST',
  });
}

export function startReview(id: string) {
  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}/review/start`, {
    method: 'POST',
  });
}

export function reviewSubmission(id: string, decision: ReviewDecision, feedback: string) {
  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, feedback }),
  });
}

export function markContentReady(id: string) {
  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}/content-ready`, {
    method: 'POST',
  });
}

export function listContentReady() {
  return apiRequest<{ submissions: Submission[] }>('/api/content');
}

export function uploadSubmissionFiles(id: string, files: File[]) {
  const body = new FormData();
  files.forEach((file) => body.append('files', file));

  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}/files`, {
    method: 'POST',
    body,
  });
}

export function removeSubmissionFile(id: string, fileId: string) {
  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}/files/${fileId}`, {
    method: 'DELETE',
  });
}

export function listSubmissions() {
  return apiRequest<{ submissions: Submission[] }>('/api/submissions');
}

export function getSubmission(id: string) {
  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}`);
}

export async function downloadSubmissionFile(submissionId: string, fileId: string, filename: string) {
  const blob = await apiDownload(`/api/submissions/${submissionId}/files/${fileId}`);
  saveBlob(blob, filename);
}

export async function downloadSubmissionExport(submissionId: string, version: number) {
  const blob = await apiDownload(`/api/submissions/${submissionId}/export`);
  saveBlob(blob, `submission-${submissionId}-v${version}.json`);
}

export async function downloadContentBundle() {
  const blob = await apiDownload('/api/content/export');
  saveBlob(blob, 'content-ready-export.json');
}

export function createTopicResource(formData: FormData) {
  return apiRequest<{ submission: Submission }>('/api/submissions/topic-resource', {
    method: 'POST',
    body: formData,
  });
}

export function updateTopicResource(id: string, formData: FormData) {
  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}/topic-resource`, {
    method: 'PUT',
    body: formData,
  });
}

export function reorderSubmissionFiles(id: string, fileIds: string[]) {
  return apiRequest<{ submission: Submission }>(`/api/submissions/${id}/reorder-files`, {
    method: 'POST',
    body: JSON.stringify({ fileIds }),
  });
}
