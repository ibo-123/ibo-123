/** Mock Grade 12 curriculum — shared + stream-specific subjects (matches backend seed). */

export const MOCK_SUBJECT_MATH = '11111111-1111-4111-8111-111111111111';
export const MOCK_SUBJECT_CHEM = '22222222-2222-4222-8222-222222222222';
export const MOCK_SUBJECT_ENG = '33333333-3333-4333-8333-333333333333';
export const MOCK_SUBJECT_ECON = '44444444-4444-4444-8444-444444444444';
export const MOCK_SUBJECT_HIST = '55555555-5555-4555-8555-555555555555';

export const MOCK_UNIT_ALGEBRA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
export const MOCK_UNIT_CALC = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
export const MOCK_UNIT_CHEM1 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
export const MOCK_UNIT_EMPTY = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
export const MOCK_UNIT_READ = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
export const MOCK_UNIT_MICRO = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
export const MOCK_UNIT_ANCIENT = 'a1a1a1a1-a1a1-4a1a-8a1a-a1a1a1a1a1a1';

export const MOCK_TOPIC_SETS = 'f1111111-1111-4111-8111-111111111111';
export const MOCK_TOPIC_EQ = 'f2222222-2222-4222-8222-222222222222';
export const MOCK_TOPIC_LIMITS = 'f3333333-3333-4333-8333-333333333333';
export const MOCK_TOPIC_STOICH = 'f4444444-4444-4444-8444-444444444444';
export const MOCK_TOPIC_MAIN = 'f5555555-5555-4555-8555-555555555555';
export const MOCK_TOPIC_DEMAND = 'f6666666-6666-4666-8666-666666666666';
export const MOCK_TOPIC_EARLY = 'f7777777-7777-4777-8777-777777777777';

const subjects = [
  {
    id: MOCK_SUBJECT_MATH,
    name: 'Mathematics',
    slug: 'mathematics',
    grade: 12,
    stream: null as string | null,
    sort_order: 1,
  },
  {
    id: MOCK_SUBJECT_CHEM,
    name: 'Chemistry',
    slug: 'chemistry',
    grade: 12,
    stream: 'natural_science' as const,
    sort_order: 2,
  },
  {
    id: MOCK_SUBJECT_ENG,
    name: 'English',
    slug: 'english',
    grade: 12,
    stream: null as string | null,
    sort_order: 3,
  },
  {
    id: MOCK_SUBJECT_ECON,
    name: 'Economics',
    slug: 'economics',
    grade: 12,
    stream: 'social_science' as const,
    sort_order: 6,
  },
  {
    id: MOCK_SUBJECT_HIST,
    name: 'History',
    slug: 'history',
    grade: 12,
    stream: 'social_science' as const,
    sort_order: 8,
  },
];

const unitsBySubject: Record<
  string,
  { id: string; subject_id: string; name: string; slug: string; sort_order: number }[]
> = {
  [MOCK_SUBJECT_MATH]: [
    {
      id: MOCK_UNIT_ALGEBRA,
      subject_id: MOCK_SUBJECT_MATH,
      name: 'Algebra',
      slug: 'algebra',
      sort_order: 1,
    },
    {
      id: MOCK_UNIT_CALC,
      subject_id: MOCK_SUBJECT_MATH,
      name: 'Calculus',
      slug: 'calculus',
      sort_order: 2,
    },
  ],
  [MOCK_SUBJECT_CHEM]: [
    {
      id: MOCK_UNIT_CHEM1,
      subject_id: MOCK_SUBJECT_CHEM,
      name: 'Stoichiometry',
      slug: 'stoichiometry',
      sort_order: 1,
    },
    {
      id: MOCK_UNIT_EMPTY,
      subject_id: MOCK_SUBJECT_CHEM,
      name: 'Coming later',
      slug: 'coming-later',
      sort_order: 2,
    },
  ],
  [MOCK_SUBJECT_ENG]: [
    {
      id: MOCK_UNIT_READ,
      subject_id: MOCK_SUBJECT_ENG,
      name: 'Reading Comprehension',
      slug: 'reading-comprehension',
      sort_order: 1,
    },
  ],
  [MOCK_SUBJECT_ECON]: [
    {
      id: MOCK_UNIT_MICRO,
      subject_id: MOCK_SUBJECT_ECON,
      name: 'Microeconomics Basics',
      slug: 'microeconomics-basics',
      sort_order: 1,
    },
  ],
  [MOCK_SUBJECT_HIST]: [
    {
      id: MOCK_UNIT_ANCIENT,
      subject_id: MOCK_SUBJECT_HIST,
      name: 'Ancient Civilizations',
      slug: 'ancient-civilizations',
      sort_order: 1,
    },
  ],
};

const topicsByUnit: Record<
  string,
  {
    id: string;
    unit_id: string;
    name: string;
    slug: string;
    sort_order: number;
    estimated_study_minutes: number;
  }[]
> = {
  [MOCK_UNIT_ALGEBRA]: [
    {
      id: MOCK_TOPIC_SETS,
      unit_id: MOCK_UNIT_ALGEBRA,
      name: 'Sets and Intervals',
      slug: 'sets-and-intervals',
      sort_order: 1,
      estimated_study_minutes: 45,
    },
    {
      id: MOCK_TOPIC_EQ,
      unit_id: MOCK_UNIT_ALGEBRA,
      name: 'Equations and Inequalities',
      slug: 'equations-and-inequalities',
      sort_order: 2,
      estimated_study_minutes: 60,
    },
  ],
  [MOCK_UNIT_CALC]: [
    {
      id: MOCK_TOPIC_LIMITS,
      unit_id: MOCK_UNIT_CALC,
      name: 'Limits',
      slug: 'limits',
      sort_order: 1,
      estimated_study_minutes: 45,
    },
  ],
  [MOCK_UNIT_CHEM1]: [
    {
      id: MOCK_TOPIC_STOICH,
      unit_id: MOCK_UNIT_CHEM1,
      name: 'Mole Concept',
      slug: 'mole-concept',
      sort_order: 1,
      estimated_study_minutes: 50,
    },
  ],
  [MOCK_UNIT_EMPTY]: [],
  [MOCK_UNIT_READ]: [
    {
      id: MOCK_TOPIC_MAIN,
      unit_id: MOCK_UNIT_READ,
      name: 'Main Ideas and Details',
      slug: 'main-ideas-and-details',
      sort_order: 1,
      estimated_study_minutes: 30,
    },
  ],
  [MOCK_UNIT_MICRO]: [
    {
      id: MOCK_TOPIC_DEMAND,
      unit_id: MOCK_UNIT_MICRO,
      name: 'Demand and Supply',
      slug: 'demand-and-supply',
      sort_order: 1,
      estimated_study_minutes: 45,
    },
  ],
  [MOCK_UNIT_ANCIENT]: [
    {
      id: MOCK_TOPIC_EARLY,
      unit_id: MOCK_UNIT_ANCIENT,
      name: 'Early Human Societies',
      slug: 'early-human-societies',
      sort_order: 1,
      estimated_study_minutes: 45,
    },
  ],
};

function findSubject(id: string) {
  return subjects.find((subject) => subject.id === id) ?? null;
}

function findUnit(id: string) {
  for (const units of Object.values(unitsBySubject)) {
    const unit = units.find((item) => item.id === id);
    if (unit) {
      return unit;
    }
  }
  return null;
}

function findTopic(id: string) {
  for (const topics of Object.values(topicsByUnit)) {
    const topic = topics.find((item) => item.id === id);
    if (topic) {
      return topic;
    }
  }
  return null;
}

type SubjectsFilter = {
  grade?: number;
  stream?: string;
};

/**
 * Match backend `selectable_subjects_queryset`:
 * grade match when provided; stream-null subjects for any track;
 * stream-specific subjects only for that submitted stream.
 */
export function mockCurriculumSubjects(filter?: SubjectsFilter | string) {
  const opts: SubjectsFilter =
    typeof filter === 'string' ? { stream: filter } : (filter ?? {});
  const items = subjects.filter((subject) => {
    if (opts.grade != null && subject.grade !== opts.grade) {
      return false;
    }
    if (!opts.stream) {
      return true;
    }
    return subject.stream === null || subject.stream === opts.stream;
  });
  return { items, count: items.length };
}

export function mockCurriculumUnits(subjectId: string) {
  const subject = findSubject(subjectId);
  if (!subject) {
    return null;
  }
  const items = unitsBySubject[subjectId] ?? [];
  return { subject, items, count: items.length };
}

export function mockCurriculumTopics(unitId: string) {
  const unit = findUnit(unitId);
  if (!unit) {
    return null;
  }
  const items = topicsByUnit[unitId] ?? [];
  return { unit, items, count: items.length };
}

/** Rich contract §13.4 extras keyed by topic id (mocks only). */
const topicDetailExtras: Record<
  string,
  {
    concepts: string[];
    prerequisites: { id: string; name: string }[];
    learning_objectives: string[];
    recommended_resources: { title: string; url?: string }[];
    question_count: number;
  }
> = {
  [MOCK_TOPIC_SETS]: {
    concepts: ['Set notation', 'Intervals on the real line'],
    prerequisites: [],
    learning_objectives: [
      'Read and write set notation for common number sets',
      'Describe open, closed, and half-open intervals',
      'Translate between inequality and interval form',
    ],
    recommended_resources: [{ title: 'Grade 12 Algebra notes — Sets' }],
    question_count: 28,
  },
  [MOCK_TOPIC_EQ]: {
    concepts: ['Linear equations', 'Quadratic inequalities'],
    prerequisites: [{ id: MOCK_TOPIC_SETS, name: 'Sets and Intervals' }],
    learning_objectives: [
      'Solve linear and quadratic equations with real coefficients',
      'Graph solution sets for inequalities on a number line',
      'Check extraneous roots from absolute-value equations',
    ],
    recommended_resources: [{ title: 'Past paper drill — Equations' }],
    question_count: 45,
  },
  [MOCK_TOPIC_LIMITS]: {
    concepts: ['Limit intuition', 'One-sided limits'],
    prerequisites: [{ id: MOCK_TOPIC_EQ, name: 'Equations and Inequalities' }],
    learning_objectives: [
      'Estimate limits from tables and graphs',
      'Apply limit laws to simple rational functions',
    ],
    recommended_resources: [],
    question_count: 32,
  },
  [MOCK_TOPIC_STOICH]: {
    concepts: ['Mole', 'Molar mass', 'Stoichiometric ratios'],
    prerequisites: [],
    learning_objectives: [
      'Convert between mass, moles, and number of particles',
      'Use balanced equations to find limiting reactants',
    ],
    recommended_resources: [{ title: 'Chemistry workbook — Mole concept' }],
    question_count: 40,
  },
  [MOCK_TOPIC_MAIN]: {
    concepts: ['Main idea', 'Supporting detail'],
    prerequisites: [],
    learning_objectives: [
      'Identify the main idea of a passage in one sentence',
      'Distinguish supporting details from digressions',
    ],
    recommended_resources: [],
    question_count: 22,
  },
  [MOCK_TOPIC_DEMAND]: {
    concepts: ['Demand', 'Supply', 'Market equilibrium'],
    prerequisites: [],
    learning_objectives: [
      'Sketch demand and supply curves from a simple schedule',
      'Identify equilibrium price and quantity on a diagram',
    ],
    recommended_resources: [{ title: 'Economics workbook — Demand & supply' }],
    question_count: 36,
  },
  [MOCK_TOPIC_EARLY]: {
    concepts: ['Hunter-gatherers', 'Agricultural revolution'],
    prerequisites: [],
    learning_objectives: [
      'Describe how early societies organized food and shelter',
      'Explain why agriculture changed settlement patterns',
    ],
    recommended_resources: [],
    question_count: 30,
  },
};

export function mockCurriculumTopicDetail(topicId: string) {
  const topic = findTopic(topicId);
  if (!topic) {
    return null;
  }
  const unit = findUnit(topic.unit_id);
  if (!unit) {
    return null;
  }
  const extras = topicDetailExtras[topicId] ?? {
    concepts: [],
    prerequisites: [],
    learning_objectives: [],
    recommended_resources: [],
    question_count: null as number | null,
  };
  return {
    ...topic,
    subject_id: unit.subject_id,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...extras,
  };
}
