import { create } from 'zustand';

import type { SessionTokens } from '@/shared/api/sessionBridge';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/shared/lib/secureStorage';

import { LIVE_ONBOARDING_TRACK, type OnboardingStream } from './onboardingTrack';

export type { SessionTokens };

const ACCESS_KEY = 'temari.access_token';
const REFRESH_KEY = 'temari.refresh_token';
/** Phone waiting on OTP. No tokens yet — this is how a killed verify screen comes back. */
const PENDING_PHONE_KEY = 'temari.pending_phone';

/** Snapshot of GET /auth/me used by the route gate. Restored on launch, not stored raw. */
export type SessionProfile = {
  onboarded: boolean;
  phoneVerified: boolean;
  phoneNumber: string | null;
};

/**
 * One-shot landing after onboarding. Not stored: a later launch opens Today.
 * Must be written in the same update as `profile`, or the gate sends her to Today first.
 */
export type DiagnosticEntry = '/(app)/diagnostic';

type SessionState = {
  accessToken: string | null;
  refreshToken: string | null;
  /** SecureStore read finished (profile may still be loading when tokens exist). */
  hydrated: boolean;
  profile: SessionProfile | null;
  pendingVerificationPhone: string | null;
  /** Not persisted — the countdown starts over after a cold start. */
  pendingVerificationExpiresIn: number | null;
  /**
   * Login returned `requires_2fa`. Memory only: the challenge token is dropped,
   * so killing the app returns her to Login.
   */
  twoFactorPending: boolean;
  /** Lets one explicit escape (change number) leave Verify without an instant bounce. */
  skipNextCorrection: boolean;
  /** Memory only. The gate opens this instead of Today for the save that just finished. */
  appEntry: DiagnosticEntry | null;
  /** Stream chosen on sign-up. Onboarding opens with this already selected. */
  preferredStream: OnboardingStream;
  hydrate: () => Promise<void>;
  setSession: (tokens: SessionTokens) => Promise<void>;
  setProfile: (profile: SessionProfile) => void;
  /** Profile and diagnostic entry together, so the gate does not flash Today. */
  enterDiagnostic: (profile: SessionProfile) => void;
  /** Contract §9.1 — new refresh token replaces the old one immediately. Keeps profile. */
  rotateTokens: (tokens: SessionTokens) => Promise<void>;
  setPendingVerification: (phone: string, expiresIn: number) => Promise<void>;
  leaveVerification: () => Promise<void>;
  setTwoFactorPending: (pending: boolean) => void;
  leaveTwoFactor: () => void;
  setPreferredStream: (stream: OnboardingStream) => void;
  clearSession: () => Promise<void>;
  /** Local wipe only. Prefer `useLogout` so the server is notified first. */
  logout: () => Promise<void>;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  profile: null,
  pendingVerificationPhone: null,
  pendingVerificationExpiresIn: null,
  twoFactorPending: false,
  skipNextCorrection: false,
  appEntry: null,
  preferredStream: LIVE_ONBOARDING_TRACK.stream,

  hydrate: async () => {
    if (get().hydrated) {
      return;
    }
    const [accessToken, refreshToken, pendingVerificationPhone] = await Promise.all([
      getSecureItem(ACCESS_KEY),
      getSecureItem(REFRESH_KEY),
      getSecureItem(PENDING_PHONE_KEY),
    ]);
    set({ accessToken, refreshToken, pendingVerificationPhone, hydrated: true });
  },

  setSession: async ({ accessToken, refreshToken }) => {
    await Promise.all([
      setSecureItem(ACCESS_KEY, accessToken),
      setSecureItem(REFRESH_KEY, refreshToken),
      deleteSecureItem(PENDING_PHONE_KEY),
    ]);
    set({
      accessToken,
      refreshToken,
      profile: null,
      pendingVerificationPhone: null,
      pendingVerificationExpiresIn: null,
      twoFactorPending: false,
      appEntry: null,
    });
  },

  setProfile: (profile) => {
    set({ profile });
  },

  enterDiagnostic: (profile) => {
    set({ profile, appEntry: '/(app)/diagnostic' });
  },

  rotateTokens: async ({ accessToken, refreshToken }) => {
    await Promise.all([
      setSecureItem(ACCESS_KEY, accessToken),
      setSecureItem(REFRESH_KEY, refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },

  setPendingVerification: async (phone, expiresIn) => {
    await setSecureItem(PENDING_PHONE_KEY, phone);
    set({
      pendingVerificationPhone: phone,
      pendingVerificationExpiresIn: expiresIn,
      twoFactorPending: false,
    });
  },

  leaveVerification: async () => {
    set({
      pendingVerificationPhone: null,
      pendingVerificationExpiresIn: null,
      skipNextCorrection: true,
    });
    await deleteSecureItem(PENDING_PHONE_KEY);
  },

  setTwoFactorPending: (twoFactorPending) => {
    set({ twoFactorPending });
  },

  leaveTwoFactor: () => {
    set({ twoFactorPending: false, skipNextCorrection: true });
  },

  setPreferredStream: (preferredStream) => {
    set({ preferredStream });
  },

  clearSession: async () => {
    await Promise.all([
      deleteSecureItem(ACCESS_KEY),
      deleteSecureItem(REFRESH_KEY),
      deleteSecureItem(PENDING_PHONE_KEY),
    ]);
    set({
      accessToken: null,
      refreshToken: null,
      profile: null,
      pendingVerificationPhone: null,
      pendingVerificationExpiresIn: null,
      twoFactorPending: false,
      appEntry: null,
      preferredStream: LIVE_ONBOARDING_TRACK.stream,
    });
  },

  logout: async () => {
    await get().clearSession();
  },
}));

export function getSessionTokens(): Pick<SessionState, 'accessToken' | 'refreshToken'> {
  const { accessToken, refreshToken } = useSessionStore.getState();
  return { accessToken, refreshToken };
}

/** True when SecureStore (or memory) still holds a usable session pair. */
export function hasSessionTokens(): boolean {
  const { accessToken, refreshToken } = useSessionStore.getState();
  return Boolean(accessToken || refreshToken);
}
