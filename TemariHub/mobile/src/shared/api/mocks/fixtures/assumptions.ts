/** Mobile implementation plan §9 — assumed shapes until backend confirms. */

/** G2 — practice session start */
export const mockPracticeSessionStart = {
  session_id: 'practice-session-uuid',
  question_ids: ['q-1', 'q-2', 'q-3'],
};

/** G6 — dashboard today payload (assumed item shapes) */
export const mockDashboardMe = {
  greeting: 'Good evening, Selam',
  streak_days: 4,
  recommended_next: {
    type: 'topic',
    topic_id: 'topic-algebra',
    topic_name: 'Quadratic equations',
    subject_name: 'Mathematics',
  },
  weak_subject: {
    subject_id: 'sub-chem',
    subject_name: 'Chemistry',
    mastery_score: 0.42,
  },
};

/** G1 — diagnostic start with question_ids + subject_name */
export const mockDiagnosticStart = {
  test_id: 'diag-uuid',
  total_questions: 100,
  sections: [
    {
      section_id: 'sec-chem',
      subject_id: 'sub-chem',
      subject_name: 'Chemistry',
      question_count: 25,
      question_ids: ['q-chem-1', 'q-chem-2', 'q-chem-3'],
    },
    {
      section_id: 'sec-math',
      subject_id: 'sub-math',
      subject_name: 'Mathematics',
      question_count: 25,
      question_ids: ['q-math-1', 'q-math-2'],
    },
  ],
};

/** G12 — RAG conversations list item */
export const mockRagConversationsPage = {
  items: [
    {
      conversation_id: 'conv-1',
      title: 'Explain moles',
      topic_name: 'Amount of substance',
      updated_at: '2026-10-02T18:30:00Z',
    },
  ],
  page: 1,
  page_size: 20,
  total: 1,
};

/** G4 / G5 — diagnostic answer + complete */
export const mockDiagnosticAnswer = { recorded: true };

export const mockDiagnosticComplete = {
  subjects: [{ subject_id: 'sub-chem', subject_name: 'Chemistry', score_pct: 68 }],
  strong_topics: [{ topic_id: 't-strong', topic_name: 'Stoichiometry', mastery_score: 0.82 }],
  weak_topics: [{ topic_id: 't-weak', topic_name: 'Redox', mastery_score: 0.38 }],
};

/** G10 / G11 — tutor chat */
export const mockRagChatResponse = {
  conversation_id: 'conv-new',
  message: 'Moles link mass and particle count via Avogadro’s number.',
  sources: [{ chunk_id: 'chunk-1', title: 'Grade 12 Chemistry — Amount of substance' }],
};

export const mockRateLimitedError = {
  error: {
    code: 'RATE_LIMITED',
    message: 'Too many tutor messages. Try again shortly.',
    retry_after_seconds: 30,
  },
};
