/** Backend curriculum serializers + contract §13. */

export type CurriculumStream = 'natural_science' | 'social_science';

export type Subject = {
  id: string;
  name: string;
  slug: string;
  grade: number;
  stream: CurriculumStream | null;
  sort_order: number;
};

export type Unit = {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type TopicListItem = {
  id: string;
  unit_id: string;
  name: string;
  slug: string;
  sort_order: number;
  /** Backend may return null; list UI treats missing as 0. */
  estimated_study_minutes: number;
};

/** Contract §13.4 prerequisite when the API starts returning objects. */
export type TopicPrerequisite = {
  id: string;
  name: string;
};

/** Contract §13.4 recommended resource when present. */
export type TopicResource = {
  title: string;
  url?: string;
};

/**
 * Topic detail — contract §13.4 core + live Django extras.
 * `concepts` / `prerequisites` / `learning_objectives` / `recommended_resources`
 * / `question_count` default empty when the lean serializer omits them.
 */
export type TopicDetail = TopicListItem & {
  /** Present on live Django; optional on pure contract §13.4 samples. */
  subject_id?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  concepts: string[];
  prerequisites: TopicPrerequisite[];
  learning_objectives: string[];
  recommended_resources: TopicResource[];
  /** Absent / null on live API until backend adds it — UI shows an honest dash. */
  question_count: number | null;
};

export type SubjectsList = {
  items: Subject[];
  count: number;
};

export type SubjectUnitsList = {
  subject: Subject;
  items: Unit[];
  count: number;
};

export type UnitTopicsList = {
  unit: Unit;
  items: TopicListItem[];
  count: number;
};

export type SubjectsQuery = {
  grade: number;
  stream: string;
};
