import { apiRequest } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';

import {
  readSubjectUnitsList,
  readSubjectsList,
  readTopicDetail,
  readUnitTopicsList,
} from './schemas';
import type {
  SubjectUnitsList,
  SubjectsList,
  SubjectsQuery,
  TopicDetail,
  UnitTopicsList,
} from './types';

/**
 * GET /curriculum/subjects?grade=&stream=
 * Backend: `{ items, count }` (optionally wrapped in `{ success, data }`).
 */
export async function fetchSubjects(query: SubjectsQuery, signal?: AbortSignal): Promise<SubjectsList> {
  const params = new URLSearchParams({
    grade: String(query.grade),
    stream: query.stream,
  });
  const body = await apiRequest<unknown>(`/curriculum/subjects?${params.toString()}`, { signal });
  const list = readSubjectsList(body);
  if (!list) {
    throw new ApiError('INVALID_RESPONSE', 'We couldn’t read your subjects.', 502);
  }
  return list;
}

/** GET /curriculum/subjects/{id}/units */
export async function fetchSubjectUnits(
  subjectId: string,
  signal?: AbortSignal,
): Promise<SubjectUnitsList> {
  const body = await apiRequest<unknown>(`/curriculum/subjects/${subjectId}/units`, { signal });
  const list = readSubjectUnitsList(body);
  if (!list) {
    throw new ApiError('INVALID_RESPONSE', 'We couldn’t read this subject’s units.', 502);
  }
  return list;
}

/** GET /curriculum/units/{id}/topics */
export async function fetchUnitTopics(unitId: string, signal?: AbortSignal): Promise<UnitTopicsList> {
  const body = await apiRequest<unknown>(`/curriculum/units/${unitId}/topics`, { signal });
  const list = readUnitTopicsList(body);
  if (!list) {
    throw new ApiError('INVALID_RESPONSE', 'We couldn’t read this unit’s topics.', 502);
  }
  return list;
}

/** GET /curriculum/topics/{id} — contract §13.4 fields optional on live API. */
export async function fetchTopic(topicId: string, signal?: AbortSignal): Promise<TopicDetail> {
  const body = await apiRequest<unknown>(`/curriculum/topics/${topicId}`, { signal });
  const topic = readTopicDetail(body);
  if (!topic) {
    throw new ApiError('INVALID_RESPONSE', 'We couldn’t read this topic.', 502);
  }
  return topic;
}
