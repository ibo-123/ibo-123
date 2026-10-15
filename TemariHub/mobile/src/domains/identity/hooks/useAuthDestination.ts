import type { Href } from 'expo-router';

import { hrefFor, resolveAuthTarget, type AuthTarget } from '../authDestination';
import { useSessionStore } from '../session.store';

export type AuthDestination =
  { status: 'loading' } | { status: 'ready'; target: AuthTarget; href: Href };

/**
 * Session + `/auth/me` profile. Stays `loading` until hydrate finishes and, when
 * tokens exist, until the profile is in memory — so Today never paints first.
 */
export function useAuthDestination(): AuthDestination {
  const hydrated = useSessionStore((state) => state.hydrated);
  const accessToken = useSessionStore((state) => state.accessToken);
  const refreshToken = useSessionStore((state) => state.refreshToken);
  const profile = useSessionStore((state) => state.profile);
  const pendingVerificationPhone = useSessionStore((state) => state.pendingVerificationPhone);
  const pendingVerificationExpiresIn = useSessionStore(
    (state) => state.pendingVerificationExpiresIn,
  );
  const twoFactorPending = useSessionStore((state) => state.twoFactorPending);
  const appEntry = useSessionStore((state) => state.appEntry);

  if (!hydrated) {
    return { status: 'loading' };
  }

  const hasSession = Boolean(accessToken || refreshToken);
  if (hasSession && !profile) {
    return { status: 'loading' };
  }

  const target = resolveAuthTarget({
    hasSession,
    profile,
    pendingVerificationPhone,
    pendingVerificationExpiresIn,
    twoFactorPending,
  });

  return {
    status: 'ready',
    target,
    href: hrefFor(target, appEntry),
  };
}

export { hrefFor };
