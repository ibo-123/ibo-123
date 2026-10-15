/** Student-safe GET /questions/{id} fixtures for diagnostic + practice mocks. */

type MockQuestion = {
  id: string;
  prompt: string;
  question_type: 'mcq_single';
  difficulty: number;
  estimated_time_seconds: number | null;
  source?: string;
  exam_year?: number | null;
  subject: { id: string; name: string; slug: string };
  unit: { id: string; name: string; slug: string };
  topic: { id: string; name: string; slug: string };
  concept: { id: string; name: string; slug: string };
  options: { id: string; text: string; sort_order: number }[];
};

function chemQuestion(
  id: string,
  prompt: string,
  choices: [string, string, string, string],
): MockQuestion {
  return {
    id,
    prompt,
    question_type: 'mcq_single',
    difficulty: 2,
    estimated_time_seconds: 60,
    source: 'Entrance Exam',
    exam_year: 2023,
    subject: { id: 'sub-chem', name: 'Chemistry', slug: 'chemistry' },
    unit: { id: 'unit-chem-1', name: 'Stoichiometry', slug: 'stoichiometry' },
    topic: { id: 'topic-moles', name: 'Amount of substance', slug: 'amount-of-substance' },
    concept: { id: 'concept-mole', name: 'Mole', slug: 'mole' },
    options: choices.map((text, sort_order) => ({
      id: `${id}-opt-${sort_order}`,
      text,
      sort_order,
    })),
  };
}

function mathQuestion(
  id: string,
  prompt: string,
  choices: [string, string, string, string],
): MockQuestion {
  return {
    id,
    prompt,
    question_type: 'mcq_single',
    difficulty: 2,
    estimated_time_seconds: 75,
    source: 'Practice',
    exam_year: null,
    subject: { id: 'sub-math', name: 'Mathematics', slug: 'mathematics' },
    unit: { id: 'unit-alg', name: 'Algebra', slug: 'algebra' },
    topic: { id: 'topic-quad', name: 'Quadratic equations', slug: 'quadratic-equations' },
    concept: { id: 'concept-disc', name: 'Discriminant', slug: 'discriminant' },
    options: choices.map((text, sort_order) => ({
      id: `${id}-opt-${sort_order}`,
      text,
      sort_order,
    })),
  };
}

const QUESTIONS: Record<string, MockQuestion> = {
  'q-chem-1': chemQuestion('q-chem-1', 'What is the SI unit for amount of substance?', [
    'Mole',
    'Gram',
    'Litre',
    'Pascal',
  ]),
  'q-chem-2': chemQuestion('q-chem-2', 'Avogadro’s number is approximately:', [
    '6.02 × 10²³',
    '3.00 × 10⁸',
    '9.81',
    '1.60 × 10⁻¹⁹',
  ]),
  'q-chem-3': chemQuestion('q-chem-3', 'Which process conserves atoms but not molecules?', [
    'Chemical reaction',
    'Physical change only',
    'Phase change only',
    'Nuclear decay only',
  ]),
  'q-math-1': mathQuestion('q-math-1', 'For ax² + bx + c = 0, the discriminant is:', [
    'b² − 4ac',
    'b² + 4ac',
    '2a',
    '−b / 2a',
  ]),
  'q-math-2': mathQuestion('q-math-2', 'If the discriminant is negative, the roots are:', [
    'Complex (non-real)',
    'Equal and real',
    'Two distinct real roots',
    'Undefined',
  ]),
};

export function mockQuestionById(questionId: string): MockQuestion | null {
  return QUESTIONS[questionId] ?? null;
}
