import { Redirect, useSegments } from 'expo-router';
import { useLayoutEffect, type ReactNode } from 'react';

import { isDestinationAllowed } from './authDestination';
import { useAuthDestination } from './hooks/useAuthDestination';
import { useSessionStore } from './session.store';

type AuthGateProps = {
  children: ReactNode;
};

/**
 * Keeps the visible stack on the one screen that matches the session.
 * While `/auth/me` is still in flight, the current screen stays put (no swap to Today).
 * `skipNextCorrection` lets "Wrong number" reach Sign Up without a bounce back to Verify.
 */
export function AuthGate({ children }: AuthGateProps) {
  const destination = useAuthDestination();
  const segments = useSegments();
  const skipNextCorrection = useSessionStore((state) => state.skipNextCorrection);
  const appEntry = useSessionStore((state) => state.appEntry);

  const allowed =
    destination.status === 'ready' && isDestinationAllowed(segments, destination.target);

  useLayoutEffect(() => {
    if (!skipNextCorrection || !allowed) {
      return;
    }
    useSessionStore.setState({ skipNextCorrection: false });
  }, [allowed, skipNextCorrection]);

  useLayoutEffect(() => {
    if (!appEntry || !allowed || segments[0] !== '(app)') {
      return;
    }
    useSessionStore.setState({ appEntry: null });
  }, [allowed, appEntry, segments]);

  if (destination.status !== 'ready') {
    return children;
  }
  if (skipNextCorrection && !allowed) {
    return children;
  }
  if (!allowed) {
    return <Redirect href={destination.href} />;
  }
  return children;
}

/** Cold start lands here (`/`) and leaves immediately for the gated screen. */
export function AuthRedirect() {
  const destination = useAuthDestination();
  if (destination.status !== 'ready') {
    return null;
  }
  return <Redirect href={destination.href} />;
}
