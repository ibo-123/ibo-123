import { apiRequest } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';

import { readDiagnosticAnswerResult, readDiagnosticStart } from './schemas';
import type { DiagnosticAnswerRequest, DiagnosticAnswerResult, DiagnosticStart } from './types';

/** POST /diagnostic/start — G1 assumed shape. */
export async function startDiagnostic(signal?: AbortSignal): Promise<DiagnosticStart> {
  const body = await apiRequest<unknown>('/diagnostic/start', { method: 'POST', signal });
  const start = readDiagnosticStart(body);
  if (!start) {
    throw new ApiError('INVALID_RESPONSE', 'We couldn’t start your diagnostic.', 502);
  }
  return start;
}

/** POST /diagnostic/{id}/answer — G4 `{ recorded: true }`. */
export async function submitDiagnosticAnswer(
  testId: string,
  input: DiagnosticAnswerRequest,
  signal?: AbortSignal,
): Promise<DiagnosticAnswerResult> {
  const body = await apiRequest<unknown>(`/diagnostic/${testId}/answer`, {
    method: 'POST',
    body: input,
    signal,
  });
  const result = readDiagnosticAnswerResult(body);
  if (!result) {
    throw new ApiError('INVALID_RESPONSE', 'We couldn’t save your answer.', 502);
  }
  return result;
}
