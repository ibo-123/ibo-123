import type {
  Subject,
  SubjectUnitsList,
  SubjectsList,
  TopicDetail,
  TopicListItem,
  TopicPrerequisite,
  TopicResource,
  Unit,
  UnitTopicsList,
} from './types';

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

function readSubject(value: unknown): Subject | null {
  const body = asRecord(value);
  if (
    !body ||
    !isNonEmptyString(body.id) ||
    !isNonEmptyString(body.name) ||
    !isNonEmptyString(body.slug) ||
    typeof body.grade !== 'number' ||
    typeof body.sort_order !== 'number'
  ) {
    return null;
  }

  const stream =
    body.stream === null || body.stream === undefined
      ? null
      : isNonEmptyString(body.stream)
        ? (body.stream as Subject['stream'])
        : null;

  if (body.stream !== null && body.stream !== undefined && stream === null) {
    return null;
  }

  return {
    id: body.id,
    name: body.name,
    slug: body.slug,
    grade: body.grade,
    stream,
    sort_order: body.sort_order,
  };
}

function readUnit(value: unknown): Unit | null {
  const body = asRecord(value);
  if (
    !body ||
    !isNonEmptyString(body.id) ||
    !isNonEmptyString(body.subject_id) ||
    !isNonEmptyString(body.name) ||
    !isNonEmptyString(body.slug) ||
    typeof body.sort_order !== 'number'
  ) {
    return null;
  }
  return {
    id: body.id,
    subject_id: body.subject_id,
    name: body.name,
    slug: body.slug,
    sort_order: body.sort_order,
  };
}

function readTopicListItem(value: unknown): TopicListItem | null {
  const body = asRecord(value);
  if (
    !body ||
    !isNonEmptyString(body.id) ||
    !isNonEmptyString(body.unit_id) ||
    !isNonEmptyString(body.name) ||
    !isNonEmptyString(body.slug) ||
    typeof body.sort_order !== 'number'
  ) {
    return null;
  }
  const minutes =
    typeof body.estimated_study_minutes === 'number'
      ? body.estimated_study_minutes
      : body.estimated_study_minutes == null
        ? 0
        : null;
  if (minutes === null) {
    return null;
  }
  return {
    id: body.id,
    unit_id: body.unit_id,
    name: body.name,
    slug: body.slug,
    sort_order: body.sort_order,
    estimated_study_minutes: minutes,
  };
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const items: string[] = [];
  for (const entry of value) {
    if (isNonEmptyString(entry)) {
      items.push(entry);
    }
  }
  return items;
}

function readPrerequisite(value: unknown): TopicPrerequisite | null {
  if (isNonEmptyString(value)) {
    return { id: value, name: value };
  }
  const body = asRecord(value);
  if (!body || !isNonEmptyString(body.id) || !isNonEmptyString(body.name)) {
    return null;
  }
  return { id: body.id, name: body.name };
}

function readPrerequisites(value: unknown): TopicPrerequisite[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const items: TopicPrerequisite[] = [];
  for (const entry of value) {
    const prereq = readPrerequisite(entry);
    if (prereq) {
      items.push(prereq);
    }
  }
  return items;
}

function readResource(value: unknown): TopicResource | null {
  if (isNonEmptyString(value)) {
    return { title: value };
  }
  const body = asRecord(value);
  if (!body || !isNonEmptyString(body.title)) {
    return null;
  }
  return {
    title: body.title,
    url: isNonEmptyString(body.url) ? body.url : undefined,
  };
}

function readResources(value: unknown): TopicResource[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const items: TopicResource[] = [];
  for (const entry of value) {
    const resource = readResource(entry);
    if (resource) {
      items.push(resource);
    }
  }
  return items;
}

export function readSubjectsList(value: unknown): SubjectsList | null {
  const body = asRecord(unwrapApiData(value));
  if (!body || !Array.isArray(body.items) || typeof body.count !== 'number') {
    return null;
  }
  const items: Subject[] = [];
  for (const raw of body.items) {
    const subject = readSubject(raw);
    if (!subject) {
      return null;
    }
    items.push(subject);
  }
  return { items, count: body.count };
}

export function readSubjectUnitsList(value: unknown): SubjectUnitsList | null {
  const body = asRecord(unwrapApiData(value));
  if (!body || !Array.isArray(body.items) || typeof body.count !== 'number') {
    return null;
  }
  const subject = readSubject(body.subject);
  if (!subject) {
    return null;
  }
  const items: Unit[] = [];
  for (const raw of body.items) {
    const unit = readUnit(raw);
    if (!unit) {
      return null;
    }
    items.push(unit);
  }
  return { subject, items, count: body.count };
}

export function readUnitTopicsList(value: unknown): UnitTopicsList | null {
  const body = asRecord(unwrapApiData(value));
  if (!body || !Array.isArray(body.items) || typeof body.count !== 'number') {
    return null;
  }
  const unit = readUnit(body.unit);
  if (!unit) {
    return null;
  }
  const items: TopicListItem[] = [];
  for (const raw of body.items) {
    const topic = readTopicListItem(raw);
    if (!topic) {
      return null;
    }
    items.push(topic);
  }
  return { unit, items, count: body.count };
}

export function readTopicDetail(value: unknown): TopicDetail | null {
  const raw = unwrapApiData(value);
  const base = readTopicListItem(raw);
  const body = asRecord(raw);
  // Contract §13.4 needs id/name/unit_id; subject_id is a live-Django extra.
  if (!base || !body) {
    return null;
  }
  const questionCount = typeof body.question_count === 'number' ? body.question_count : null;
  return {
    ...base,
    subject_id: isNonEmptyString(body.subject_id) ? body.subject_id : undefined,
    is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
    created_at: isNonEmptyString(body.created_at) ? body.created_at : undefined,
    updated_at: isNonEmptyString(body.updated_at) ? body.updated_at : undefined,
    concepts: readStringList(body.concepts),
    prerequisites: readPrerequisites(body.prerequisites),
    learning_objectives: readStringList(body.learning_objectives),
    recommended_resources: readResources(body.recommended_resources),
    question_count: questionCount,
  };
}
