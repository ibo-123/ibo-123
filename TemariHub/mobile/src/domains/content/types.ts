/** Student-facing question bank reads — contract §14.2 (no answer disclosure). */

export type QuestionRef = {
  id: string;
  name: string;
  slug: string;
};

export type QuestionOption = {
  id: string;
  text: string;
  sort_order: number;
};

/** Student GET /questions/{id} — never includes correct_option, is_correct, or explanation. */
export type StudentQuestion = {
  id: string;
  prompt: string;
  question_type: 'mcq_single';
  difficulty: number;
  estimated_time_seconds: number | null;
  subject: QuestionRef | null;
  unit: QuestionRef | null;
  topic: QuestionRef | null;
  concept: QuestionRef | null;
  options: QuestionOption[];
  /** G15 — free text when present. */
  source?: string;
  exam_year?: number | null;
};
