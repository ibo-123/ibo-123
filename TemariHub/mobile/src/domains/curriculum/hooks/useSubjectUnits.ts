import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/errors';

import { fetchSubjectUnits } from '../api';

export const subjectUnitsQueryKey = (subjectId: string) =>
  ['curriculum', 'subjects', subjectId, 'units'] as const;

export function useSubjectUnits(subjectId: string | undefined) {
  return useQuery({
    queryKey: subjectId
      ? subjectUnitsQueryKey(subjectId)
      : (['curriculum', 'subjects', 'idle', 'units'] as const),
    queryFn: ({ signal }) => fetchSubjectUnits(subjectId!, signal),
    enabled: Boolean(subjectId),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.isUnauthorized) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
