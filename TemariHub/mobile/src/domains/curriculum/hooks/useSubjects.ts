import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/errors';

import { fetchSubjects } from '../api';
import type { SubjectsQuery } from '../types';

export const subjectsQueryKey = (query: SubjectsQuery) =>
  ['curriculum', 'subjects', query.grade, query.stream] as const;

export function useSubjects(query: SubjectsQuery | null) {
  return useQuery({
    queryKey: query ? subjectsQueryKey(query) : (['curriculum', 'subjects', 'idle'] as const),
    queryFn: ({ signal }) => fetchSubjects(query!, signal),
    enabled: query != null,
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.isUnauthorized) {
        return false;
      }
      return failureCount < 1;
    },
  });
}
