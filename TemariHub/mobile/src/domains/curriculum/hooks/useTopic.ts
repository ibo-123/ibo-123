import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/errors';

import { fetchTopic } from '../api';

export const topicQueryKey = (topicId: string) => ['curriculum', 'topics', topicId] as const;

export function useTopic(topicId: string | undefined) {
  return useQuery({
    queryKey: topicId ? topicQueryKey(topicId) : (['curriculum', 'topics', 'idle'] as const),
    queryFn: ({ signal }) => fetchTopic(topicId!, signal),
    enabled: Boolean(topicId),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.isUnauthorized) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
