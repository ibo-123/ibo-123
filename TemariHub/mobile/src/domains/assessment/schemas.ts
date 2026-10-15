import type { DiagnosticAnswerResult, DiagnosticSection, DiagnosticStart } from './types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function unwrapApiData(value: unknown): unknown {
  const body = asRecord(value);
  if (!body || body.success !== true || !('data' in body)) {
    return value;
  }
  return body.data;
}

function readStringIds(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const ids: string[] = [];
  for (const item of value) {
    if (!isNonEmptyString(item)) {
      return null;
    }
    ids.push(item);
  }
  return ids;
}

function readSection(value: unknown, index: number): DiagnosticSection | null {
  const body = asRecord(value);
  if (!body || typeof body.question_count !== 'number') {
    return null;
  }

  const questionIds = readStringIds(body.question_ids);
  if (!questionIds || questionIds.length === 0) {
    return null;
  }

  const subjectName = isNonEmptyString(body.subject_name)
    ? body.subject_name
    : isNonEmptyString(body.name)
      ? body.name
      : null;
  if (!subjectName) {
    return null;
  }

  const sectionId = isNonEmptyString(body.section_id)
    ? body.section_id
    : isNonEmptyString(body.subject_id)
      ? body.subject_id
      : `section-${index + 1}`;

  const subjectId = isNonEmptyString(body.subject_id) ? body.subject_id : undefined;

  return {
    section_id: sectionId,
    ...(subjectId ? { subject_id: subjectId } : {}),
    subject_name: subjectName,
    question_count: body.question_count,
    question_ids: questionIds,
  };
}

/** G1 — start payload with subject_name + question_ids (assumed until backend confirms). */
export function readDiagnosticStart(value: unknown): DiagnosticStart | null {
  const body = asRecord(unwrapApiData(value));
  if (!body || !Array.isArray(body.sections)) {
    return null;
  }

  const testId = isNonEmptyString(body.test_id)
    ? body.test_id
    : isNonEmptyString(body.diagnostic_test_id)
      ? body.diagnostic_test_id
      : null;
  if (!testId) {
    return null;
  }

  const sections = body.sections
    .map((section, index) => readSection(section, index))
    .filter((section): section is DiagnosticSection => section !== null);

  if (sections.length === 0 || sections.length !== body.sections.length) {
    return null;
  }

  const fromIds = sections.reduce((sum, section) => sum + section.question_ids.length, 0);
  const total =
    typeof body.total_questions === 'number' && body.total_questions > 0
      ? body.total_questions
      : fromIds;

  return {
    test_id: testId,
    total_questions: total,
    sections,
  };
}

/** G4 — `200 { recorded: true }`. */
export function readDiagnosticAnswerResult(value: unknown): DiagnosticAnswerResult | null {
  const body = asRecord(unwrapApiData(value));
  if (!body || body.recorded !== true) {
    return null;
  }
  return { recorded: true };
}
