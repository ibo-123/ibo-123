import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { fetchQuestion, questionQueryKey } from '@/domains/content';
import { ApiError } from '@/shared/api/errors';

import { startDiagnostic } from '../api';
import { useRunnerStore } from '../runner.store';
import type { DiagnosticStart } from '../types';

const START_TIMEOUT_MS = 20_000;

export function describeStartError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message && error.message !== 'Request failed') {
      return error.message;
    }
    if (error.status >= 500) {
      return 'Something went wrong on our side. Please try again.';
    }
  }
  return 'Can’t start the diagnostic. Check your connection and try again.';
}

function firstQuestionId(start: DiagnosticStart): string | undefined {
  for (const section of start.sections) {
    const id = section.question_ids[0];
    if (id) {
      return id;
    }
  }
  return undefined;
}

export function useStartDiagnostic() {
  const queryClient = useQueryClient();
  const setAttempt = useRunnerStore((state) => state.setAttempt);
  const inFlight = useRef(false);

  const mutation = useMutation({
    mutationFn: async (): Promise<DiagnosticStart> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), START_TIMEOUT_MS);
      try {
        return await startDiagnostic(controller.signal);
      } finally {
        clearTimeout(timer);
      }
    },
    onSuccess: (start) => {
      setAttempt(start);
      const firstId = firstQuestionId(start);
      if (!firstId) {
        return;
      }
      void queryClient.prefetchQuery({
        queryKey: questionQueryKey(firstId),
        queryFn: ({ signal }) => fetchQuestion(firstId, signal),
        staleTime: 5 * 60_000,
      });
    },
  });

  const { mutateAsync } = mutation;

  const submit = useCallback(async (): Promise<DiagnosticStart | null> => {
    if (inFlight.current) {
      return null;
    }
    inFlight.current = true;
    try {
      return await mutateAsync();
    } finally {
      inFlight.current = false;
    }
  }, [mutateAsync]);

  return { submit, isPending: mutation.isPending, error: mutation.error };
}
