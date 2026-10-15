/**
 * Public runtime config. Only EXPO_PUBLIC_* values belong here.
 * Feature flags default off for the sprint until their MOB issues land.
 */
export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1',
  useMocks: process.env.EXPO_PUBLIC_USE_MOCKS === 'true',
  featureSocialAuth: process.env.EXPO_PUBLIC_FEATURE_SOCIAL_AUTH === 'true',
  featureEmailAuth: process.env.EXPO_PUBLIC_FEATURE_EMAIL_AUTH === 'true',
  /** Phase 2. Open decision #6 hides the Tutor tab until this is on. */
  featureTutorTab: process.env.EXPO_PUBLIC_FEATURE_TUTOR_TAB === 'true',
} as const;
