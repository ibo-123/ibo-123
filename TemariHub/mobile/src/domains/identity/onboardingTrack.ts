/** Default selection on the exam-track screen. Grade 12 is the only live grade. */
export const LIVE_ONBOARDING_TRACK = {
  grade: 12,
  stream: 'natural_science',
} as const;

export type OnboardingStream = 'natural_science' | 'social_science';

export const GRADE_CHOICES = [
  { grade: 9, label: '9', available: false },
  { grade: 10, label: '10', available: false },
  { grade: 11, label: '11', available: false },
  { grade: 12, label: '12', available: true },
] as const;

/** Both streams are choosable. Grade still locks everything except 12. */
export const STREAM_CHOICES = [
  { stream: 'natural_science' as const, label: 'Natural Science', available: true },
  { stream: 'social_science' as const, label: 'Social Science', available: true },
] as const;
