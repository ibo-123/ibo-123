import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { ApiError } from '@/shared/api/errors';

import { fetchQuestion } from '../api';

export const questionQueryKey = (questionId: string) => ['content', 'questions', questionId] as const;

export function useQuestion(questionId: string | undefined) {
  return useQuery({
    queryKey: questionId ? questionQueryKey(questionId) : (['content', 'questions', 'idle'] as const),
    queryFn: ({ signal }) => fetchQuestion(questionId!, signal),
    enabled: Boolean(questionId),
    staleTime: 5 * 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && (error.isUnauthorized || error.status === 404)) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

/** Prefetch the next question so the quiet runner advances without a blank flash. */
export function usePrefetchQuestion(questionId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!questionId) {
      return;
    }
    void queryClient.prefetchQuery({
      queryKey: questionQueryKey(questionId),
      queryFn: ({ signal }) => fetchQuestion(questionId, signal),
      staleTime: 5 * 60_000,
    });
  }, [questionId, queryClient]);
}
