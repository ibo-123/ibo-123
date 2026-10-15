import type { QuestionOption, QuestionRef, StudentQuestion } from './types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/** Live Django wraps payloads in `{ success, message, data }`; mocks may return the body flat. */
function unwrapApiData(value: unknown): unknown {
  const body = asRecord(value);
  if (!body || body.success !== true || !('data' in body)) {
    return value;
  }
  return body.data;
}

function readQuestionRef(value: unknown): QuestionRef | null {
  const body = asRecord(value);
  if (!body || !isNonEmptyString(body.id) || !isNonEmptyString(body.name) || !isNonEmptyString(body.slug)) {
    return null;
  }
  return { id: body.id, name: body.name, slug: body.slug };
}

function readOption(value: unknown): QuestionOption | null {
  const body = asRecord(value);
  if (!body || !isNonEmptyString(body.id) || !isNonEmptyString(body.text) || typeof body.sort_order !== 'number') {
    return null;
  }
  return { id: body.id, text: body.text, sort_order: body.sort_order };
}

/** Student-safe question. Rejects payloads that leak correctness. */
export function readStudentQuestion(value: unknown): StudentQuestion | null {
  const body = asRecord(unwrapApiData(value));
  if (
    !body ||
    !isNonEmptyString(body.id) ||
    !isNonEmptyString(body.prompt) ||
    body.question_type !== 'mcq_single' ||
    typeof body.difficulty !== 'number' ||
    !Array.isArray(body.options)
  ) {
    return null;
  }

  if (
    'correct_option_id' in body ||
    'correct_option' in body ||
    'explanation' in body ||
    'is_correct' in body
  ) {
    return null;
  }

  const options = body.options.map(readOption).filter((item): item is QuestionOption => item !== null);
  if (options.length === 0 || options.length !== body.options.length) {
    return null;
  }

  const estimated =
    body.estimated_time_seconds === null || body.estimated_time_seconds === undefined
      ? null
      : typeof body.estimated_time_seconds === 'number'
        ? body.estimated_time_seconds
        : null;

  if (body.estimated_time_seconds !== null && body.estimated_time_seconds !== undefined && estimated === null) {
    return null;
  }

  const subject = body.subject == null ? null : readQuestionRef(body.subject);
  const unit = body.unit == null ? null : readQuestionRef(body.unit);
  const topic = body.topic == null ? null : readQuestionRef(body.topic);
  const concept = body.concept == null ? null : readQuestionRef(body.concept);

  if (
    (body.subject != null && subject === null) ||
    (body.unit != null && unit === null) ||
    (body.topic != null && topic === null) ||
    (body.concept != null && concept === null)
  ) {
    return null;
  }

  const source = isNonEmptyString(body.source) ? body.source : undefined;
  let examYear: number | null | undefined;
  if (body.exam_year === undefined) {
    examYear = undefined;
  } else if (body.exam_year === null || typeof body.exam_year === 'number') {
    examYear = body.exam_year;
  } else {
    return null;
  }

  return {
    id: body.id,
    prompt: body.prompt,
    question_type: 'mcq_single',
    difficulty: body.difficulty,
    estimated_time_seconds: estimated,
    subject,
    unit,
    topic,
    concept,
    options: [...options].sort((a, b) => a.sort_order - b.sort_order),
    ...(source ? { source } : {}),
    ...(examYear !== undefined ? { exam_year: examYear } : {}),
  };
}
