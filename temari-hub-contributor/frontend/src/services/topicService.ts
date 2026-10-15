import { apiRequest } from './api';
import type { TopicItem } from '../types';

export function listTopics(subject?: string, search?: string) {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (search) params.set('search', search);

  const query = params.toString();
  return apiRequest<{ topics: TopicItem[] }>(`/api/topics${query ? `?${query}` : ''}`);
}
