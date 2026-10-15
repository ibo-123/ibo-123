import { useMutation } from '@tanstack/react-query';

import { ApiError } from '@/shared/api/errors';

import { submitDiagnosticAnswer } from '../api';
import type { DiagnosticAnswerRequest, DiagnosticAnswerResult } from '../types';

export function describeAnswerError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message && error.message !== 'Request failed') {
      return error.message;
    }
    if (error.status >= 500) {
      return 'Something went wrong on our side. Please try again.';
    }
  }
  return 'Can’t save that answer. Check your connection and try again.';
}

export function useSubmitDiagnosticAnswer(testId: string | undefined) {
  return useMutation({
    mutationFn: (input: DiagnosticAnswerRequest): Promise<DiagnosticAnswerResult> => {
      if (!testId) {
        throw new ApiError('INVALID_REQUEST', 'Missing diagnostic id.', 400);
      }
      return submitDiagnosticAnswer(testId, input);
    },
  });
}
