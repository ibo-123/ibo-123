import type { AcademicVerificationStatus } from '../constants/contributors';
import type { Contributor, ContributorCreateInput, ContributorWriteInput } from '../types';
import { apiRequest } from './api';

export function listContributors() {
  return apiRequest<{ contributors: Contributor[] }>('/api/contributors');
}

export function getContributor(id: string) {
  return apiRequest<{ contributor: Contributor }>(`/api/contributors/${id}`);
}

export function createContributor(input: ContributorCreateInput) {
  return apiRequest<{ contributor: Contributor }>('/api/contributors', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateContributor(id: string, input: ContributorWriteInput) {
  return apiRequest<{ contributor: Contributor }>(`/api/contributors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function updateContributorStatus(id: string, isActive: boolean) {
  return apiRequest<{ contributor: Contributor }>(`/api/contributors/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive }),
  });
}

export function updateContributorVerification(
  id: string,
  academicVerificationStatus: AcademicVerificationStatus,
) {
  return apiRequest<{ contributor: Contributor }>(`/api/contributors/${id}/verification`, {
    method: 'PATCH',
    body: JSON.stringify({ academicVerificationStatus }),
  });
}
