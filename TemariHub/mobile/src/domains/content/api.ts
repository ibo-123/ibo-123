import { apiRequest } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';

import { readStudentQuestion } from './schemas';
import type { StudentQuestion } from './types';

/** GET /questions/{id} — student-safe payload (contract §14.2). */
export async function fetchQuestion(questionId: string, signal?: AbortSignal): Promise<StudentQuestion> {
  const body = await apiRequest<unknown>(`/questions/${questionId}`, { signal });
  const question = readStudentQuestion(body);
  if (!question) {
    throw new ApiError('INVALID_RESPONSE', 'We couldn’t read this question.', 502);
  }
  return question;
}
