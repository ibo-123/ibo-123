import type { Paginated } from '@/shared/api/pagination';

/** Contract §10.1 + §8.6 proposed fields on GET /auth/me */
export const mockMe = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  phone_number: '+251912345678',
  email: 'selam@temarihub.et',
  email_verified: true,
  full_name: 'Selam Bekele',
  grade: 12,
  stream: 'natural_science',
  phone_verified: true,
  two_factor_enabled: false,
  onboarded: true,
  auth_providers: ['phone', 'google'] as const,
};

export const mockLoginResponse = {
  access_token: 'mock-access-active',
  refresh_token: 'mock-refresh-v1',
  token_type: 'Bearer' as const,
  requires_2fa: false,
  user: {
    id: mockMe.id,
    full_name: mockMe.full_name,
    onboarded: mockMe.onboarded,
  },
};

/** Contract §6 — 2FA-enabled account: no tokens until the challenge is passed. */
export const mockLoginTwoFactorResponse = {
  access_token: null,
  refresh_token: null,
  token_type: 'Bearer' as const,
  requires_2fa: true,
  two_factor_token: 'mock-2fa-challenge',
};

/** Distinct tokens so GET /auth/me can tell a new student from Selam after relaunch. */
export const mockLoginNotOnboardedResponse = {
  ...mockLoginResponse,
  access_token: 'mock-access-new',
  refresh_token: 'mock-refresh-new-v1',
  user: { ...mockLoginResponse.user, onboarded: false },
};

/**
 * Deterministic login outcomes in mock mode. Any other valid number + password signs in
 * (onboarded). Messages mirror the backend's login service.
 */
export const mockLoginScenarios = {
  wrongPassword: 'wrong-password',
  twoFactorPhone: '+251911000002',
  disabledPhone: '+251911000003',
  rateLimitedPhone: '+251911000004',
  notOnboardedPhone: '+251911000005',
  unverifiedPhone: '+251911000006',
} as const;

export const mockLoginErrors = {
  invalidCredentials: {
    code: 'INVALID_CREDENTIALS',
    message: 'Invalid phone number or password.',
    status: 401,
  },
  accountDisabled: {
    code: 'ACCOUNT_DISABLED',
    message: 'This account is disabled.',
    status: 403,
  },
  phoneNotVerified: {
    code: 'PHONE_NOT_VERIFIED',
    message: 'Verify your phone number before logging in with a password.',
    status: 403,
  },
  tooManyRequests: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Try again in a minute.',
    status: 429,
  },
  invalidPhone: {
    code: 'INVALID_PHONE_NUMBER',
    message: 'A valid Ethiopian phone number is required.',
    status: 400,
  },
} as const;

/**
 * Deterministic register outcomes in mock mode.
 * Any other valid Ethiopian mobile + strong password registers and gets an OTP.
 */
export const mockRegisterScenarios = {
  takenPhone: '+251911000010',
  weakPassword: '12345678',
} as const;

export const mockRegisterErrors = {
  phoneTaken: {
    code: 'PHONE_TAKEN',
    message: 'An account with this phone number already exists.',
    status: 409,
  },
  invalidPhone: {
    code: 'INVALID_PHONE_NUMBER',
    message: 'A valid Ethiopian phone number is required.',
    status: 400,
  },
  weakPassword: {
    code: 'WEAK_PASSWORD',
    message: 'Choose a stronger password — at least 8 characters with letters and numbers.',
    status: 400,
  },
  tooManyRequests: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many attempts. Wait a minute and try again.',
    status: 429,
  },
} as const;

/**
 * Deterministic change-password outcomes in mock mode.
 * Any other strong new password that differs from current succeeds and rotates tokens.
 */
export const mockChangePasswordScenarios = {
  wrongCurrent: 'wrong-current',
  weakNew: '12345678',
  sameAsCurrent: 'CurrentPass1!',
} as const;

export const mockChangePasswordErrors = {
  wrongCurrent: {
    code: 'WRONG_PASSWORD',
    message: 'Current password is incorrect.',
    status: 400,
  },
  weakPassword: {
    code: 'WEAK_PASSWORD',
    message: 'Choose a stronger password — at least 8 characters with letters and numbers.',
    status: 400,
  },
  samePassword: {
    code: 'VALIDATION_ERROR',
    message: 'New password must differ from the current password.',
    status: 400,
  },
  mismatch: {
    code: 'VALIDATION_ERROR',
    message: 'Passwords do not match.',
    status: 400,
  },
} as const;

export const mockRegisterResponse = {
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  phone_number: '+251912345678',
  full_name: 'Abel Kebede',
  phone_verified: false,
  onboarded: false,
};

export const mockSendOtpResponse = {
  message: 'OTP sent successfully',
  expires_in: 300,
};

/**
 * Deterministic verify-otp outcomes in mock mode.
 * Any other 6-digit code verifies and signs in (not onboarded).
 */
export const mockVerifyOtpScenarios = {
  invalidCode: '000000',
  expiredCode: '111111',
  lockedCode: '222222',
  onboardedCode: '654321',
} as const;

export const mockVerifyOtpErrors = {
  invalidOtp: {
    code: 'INVALID_OTP',
    message: 'That code isn’t right. Try again.',
    status: 400,
  },
  otpExpired: {
    code: 'OTP_EXPIRED',
    message: 'That code expired. Send a new one.',
    status: 400,
  },
  tooManyAttempts: {
    code: 'TOO_MANY_ATTEMPTS',
    message: 'Too many tries. Request a new code.',
    status: 429,
  },
} as const;

export const mockVerifyOtpResponse = {
  access_token: 'mock-access-new',
  refresh_token: 'mock-refresh-new-v1',
  token_type: 'Bearer' as const,
  user: {
    id: mockRegisterResponse.id,
    phone_number: mockRegisterResponse.phone_number,
    full_name: mockRegisterResponse.full_name,
    phone_verified: true,
    onboarded: false,
  },
};

export const mockVerifyOtpOnboardedResponse = {
  ...mockVerifyOtpResponse,
  access_token: 'mock-access-active',
  refresh_token: 'mock-refresh-v1',
  user: {
    ...mockVerifyOtpResponse.user,
    onboarded: true,
    full_name: mockMe.full_name,
    id: mockMe.id,
  },
};

export const mockSubjectsPage: Paginated<{ id: string; name: string; slug: string }> = {
  items: [
    { id: 'sub-math', name: 'Mathematics', slug: 'mathematics' },
    { id: 'sub-chem', name: 'Chemistry', slug: 'chemistry' },
  ],
  page: 1,
  page_size: 20,
  total: 2,
};
