import { apiRequest } from '@/shared/api/client';
import { ApiError } from '@/shared/api/errors';

import { readCurrentUser } from './schemas';
import type {
  ChangePasswordRequest,
  CurrentUser,
  LoginRequest,
  OnboardingRequest,
  RegisterRequest,
  SendOtpRequest,
  VerifyOtpRequest,
} from './types';

/**
 * GET /auth/me. Unwraps the Django `{ success, data }` envelope and the flat mock body.
 * Callers treat the return value as the user — never the envelope.
 */
export async function fetchMe(): Promise<CurrentUser> {
  const body = await apiRequest<unknown>('/auth/me');
  const user = readCurrentUser(body);
  if (!user) {
    throw new ApiError('INVALID_RESPONSE', 'We couldn’t read your profile.', 502);
  }
  return user;
}

/**
 * Contract §6. Public route: a 401 here is a wrong password, not an expired session.
 * Returns `unknown` so callers validate with `isLoginResponse` before writing tokens.
 */
export async function login(body: LoginRequest, signal?: AbortSignal): Promise<unknown> {
  return apiRequest<unknown>('/auth/login', {
    method: 'POST',
    body,
    skipAuth: true,
    signal,
  });
}

/**
 * Contract §4.1. Public route — creates the account; does not send SMS (G13).
 * Returns `unknown` so callers validate with `isRegisterResponse`.
 */
export async function register(body: RegisterRequest, signal?: AbortSignal): Promise<unknown> {
  return apiRequest<unknown>('/auth/register', {
    method: 'POST',
    body,
    skipAuth: true,
    signal,
  });
}

/**
 * Contract §5.1. Public route — texts the 6-digit code after register (G13).
 * Returns `unknown` so callers validate with `isSendOtpResponse`.
 */
export async function sendPhoneOtp(body: SendOtpRequest, signal?: AbortSignal): Promise<unknown> {
  return apiRequest<unknown>('/auth/phone/send-otp', {
    method: 'POST',
    body,
    skipAuth: true,
    signal,
  });
}

/**
 * Contract §5.2. Public route — verifies the SMS code and returns tokens.
 * Returns `unknown` so callers validate with `readVerifyOtpSession`.
 */
export async function verifyPhoneOtp(
  body: VerifyOtpRequest,
  signal?: AbortSignal,
): Promise<unknown> {
  return apiRequest<unknown>('/auth/phone/verify-otp', {
    method: 'POST',
    body,
    skipAuth: true,
    signal,
  });
}

/**
 * Contract §11. Authenticated. Grade + stream, then `onboarded: true`.
 * Returns `unknown` so callers validate with `readOnboardingResult` before routing.
 */
export async function submitOnboarding(
  body: OnboardingRequest,
  signal?: AbortSignal,
): Promise<unknown> {
  return apiRequest<unknown>('/auth/onboarding', {
    method: 'POST',
    body,
    signal,
  });
}

/**
 * Contract §12. Authenticated. Rotates tokens on success — callers must
 * `rotateTokens` before continuing (old refresh is revoked).
 * Returns `unknown` so callers validate with `readChangePasswordTokens`.
 */
export async function changePassword(
  body: ChangePasswordRequest,
  signal?: AbortSignal,
): Promise<unknown> {
  return apiRequest<unknown>('/auth/change-password', {
    method: 'POST',
    body,
    signal,
  });
}

/**
 * Contract §9.2. Best-effort server revoke; callers always clear local session after.
 * Sends both `refresh_token` (contract) and `refresh` (current Django serializer).
 */
export async function logout(refreshToken: string, signal?: AbortSignal): Promise<void> {
  await apiRequest<unknown>('/auth/logout', {
    method: 'POST',
    body: { refresh_token: refreshToken, refresh: refreshToken },
    skipAuth: true,
    signal,
  });
}
