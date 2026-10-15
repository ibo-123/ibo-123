/** Diagnostic assessment — contract §15 + mobile assumptions G1/G4. */

export type DiagnosticSection = {
  section_id: string;
  subject_id?: string;
  subject_name: string;
  question_count: number;
  question_ids: string[];
};

export type DiagnosticStart = {
  test_id: string;
  total_questions: number;
  sections: DiagnosticSection[];
};

export type DiagnosticAnswerRequest = {
  question_id: string;
  selected_choice_id: string;
  time_spent_seconds: number;
};

export type DiagnosticAnswerResult = {
  recorded: true;
};

/** One item in the flattened runner queue. */
export type RunnerItem = {
  questionId: string;
  subjectName: string;
  /** 1-based index within the section. */
  indexInSection: number;
  sectionCount: number;
  /** 0-based index in the full diagnostic. */
  globalIndex: number;
};
