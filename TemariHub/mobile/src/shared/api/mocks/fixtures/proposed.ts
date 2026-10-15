/** Mobile implementation plan §8 — proposed endpoints (mock until backend approves). */

export const mockGoogleAuthResponse = {
  access_token: 'mock-access-google',
  refresh_token: 'mock-refresh-google-v1',
  token_type: 'Bearer' as const,
  user: {
    id: 'google-user-uuid',
    full_name: 'Selam Bekele',
    onboarded: false,
  },
};

export const mockEmailRegisterResponse = {
  id: 'email-user-uuid',
  email: 'selam@temarihub.et',
  full_name: 'Selam Bekele',
  email_verified: false,
  onboarded: false,
};

export const mockEmailLoginResponse = {
  access_token: 'mock-access-email',
  refresh_token: 'mock-refresh-email-v1',
  token_type: 'Bearer' as const,
  requires_2fa: false,
  user: {
    id: 'email-user-uuid',
    full_name: 'Selam Bekele',
    onboarded: true,
  },
};

export const mockPasswordForgotResponse = {
  message: 'If an account exists, a reset code was sent.',
  expires_in: 300,
};
