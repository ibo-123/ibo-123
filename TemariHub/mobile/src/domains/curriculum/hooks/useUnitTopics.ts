import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/errors';

import { fetchUnitTopics } from '../api';

export const unitTopicsQueryKey = (unitId: string) =>
  ['curriculum', 'units', unitId, 'topics'] as const;

export function useUnitTopics(unitId: string | undefined) {
  return useQuery({
    queryKey: unitId
      ? unitTopicsQueryKey(unitId)
      : (['curriculum', 'units', 'idle', 'topics'] as const),
    queryFn: ({ signal }) => fetchUnitTopics(unitId!, signal),
    enabled: Boolean(unitId),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.isUnauthorized) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
