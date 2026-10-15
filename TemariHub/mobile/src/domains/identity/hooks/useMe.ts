import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/errors';

import { fetchMe } from '../api';

export const authMeQueryKey = ['auth', 'me'] as const;

export function useMe(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: authMeQueryKey,
    queryFn: fetchMe,
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.isUnauthorized) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
