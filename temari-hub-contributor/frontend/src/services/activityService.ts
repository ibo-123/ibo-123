import type { ActivityEntry } from '../types';
import { apiRequest } from './api';

export function listActivity(entityType?: string, entityId?: string) {
  const params = new URLSearchParams();
  if (entityType && entityId) {
    params.set('entityType', entityType);
    params.set('entityId', entityId);
  }
  const query = params.toString();
  return apiRequest<{ activity: ActivityEntry[] }>(`/api/admin/activity${query ? `?${query}` : ''}`);
}
