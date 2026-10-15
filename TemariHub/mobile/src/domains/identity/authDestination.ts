import type { Href } from 'expo-router';

import type { DiagnosticEntry, SessionProfile } from './session.store';
import type { CurrentUser } from './types';

const ETHIOPIAN_MOBILE = /^\+251[79]\d{8}$/;

/** Auth screens she may use while signed out. Verify and 2FA are gated separately. */
const SIGNED_OUT_SCREENS = new Set(['login', 'signup', 'forgot-password', 'reset-password']);

export type AuthTarget =
  | { kind: 'login' }
  | { kind: 'verify'; phone: string; expiresIn: number | null }
  | { kind: 'two-factor' }
  | { kind: 'onboarding' }
  | { kind: 'app' };

/**
 * `/auth/me` is the source of truth once a session exists.
 * `phone_verified: false` is the only signal that sends a signed-in student to OTP.
 */
export function profileFromUser(user: CurrentUser): SessionProfile {
  return {
    onboarded: user.onboarded === true,
    phoneVerified: user.phone_verified !== false,
    phoneNumber: typeof user.phone_number === 'string' ? user.phone_number : null,
  };
}

function verifiedPhone(phone: string | null | undefined): string | null {
  return phone && ETHIOPIAN_MOBILE.test(phone) ? phone : null;
}

/**
 * Where Selam belongs. Callers must not use this while a session exists and
 * `/auth/me` has not landed yet — that gap is "loading", not Login.
 */
export function resolveAuthTarget(input: {
  hasSession: boolean;
  profile: SessionProfile | null;
  pendingVerificationPhone: string | null;
  pendingVerificationExpiresIn: number | null;
  twoFactorPending: boolean;
}): AuthTarget {
  if (!input.hasSession) {
    if (input.twoFactorPending) {
      return { kind: 'two-factor' };
    }
    const phone = verifiedPhone(input.pendingVerificationPhone);
    if (phone) {
      return {
        kind: 'verify',
        phone,
        expiresIn: input.pendingVerificationExpiresIn,
      };
    }
    return { kind: 'login' };
  }

  const profile = input.profile;
  if (!profile?.phoneVerified) {
    return {
      kind: 'verify',
      phone: verifiedPhone(profile?.phoneNumber) ?? '',
      expiresIn: input.pendingVerificationExpiresIn,
    };
  }
  if (!profile.onboarded) {
    return { kind: 'onboarding' };
  }
  return { kind: 'app' };
}

/** True when the current route is already the stack she should see. */
export function isDestinationAllowed(segments: readonly string[], target: AuthTarget): boolean {
  const root = segments[0];
  if (root === 'kitchen-sink' || root === '+not-found') {
    return true;
  }
  if (!root) {
    return false;
  }

  if (target.kind === 'app') {
    return root === '(app)';
  }
  if (target.kind === 'onboarding') {
    return root === '(onboarding)';
  }
  if (root !== '(auth)') {
    return false;
  }

  const leaf = segments[1] ?? '';
  if (target.kind === 'verify') {
    return leaf === 'verify';
  }
  if (target.kind === 'two-factor') {
    return leaf === 'two-factor';
  }
  return SIGNED_OUT_SCREENS.has(leaf);
}

export function hrefFor(target: AuthTarget, appEntry: DiagnosticEntry | null = null): Href {
  switch (target.kind) {
    case 'login':
      return '/(auth)/login';
    case 'two-factor':
      return '/(auth)/two-factor';
    case 'onboarding':
      return '/(onboarding)';
    case 'app':
      return appEntry ?? '/(app)/(tabs)/today';
    case 'verify':
      return {
        pathname: '/(auth)/verify',
        params: {
          phone: target.phone,
          ...(target.expiresIn != null ? { expires_in: String(target.expiresIn) } : {}),
        },
      };
  }
}
