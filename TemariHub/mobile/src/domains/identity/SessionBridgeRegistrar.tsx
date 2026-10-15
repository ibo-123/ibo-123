import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type ReactNode } from 'react';

import { appQueryClient } from '@/shared/api/queryClient';
import { registerSessionBridge } from '@/shared/api/sessionBridge';

import { profileFromUser } from './authDestination';
import { fetchMe } from './api';
import { authMeQueryKey } from './hooks/useMe';
import { hasSessionTokens, useSessionStore } from './session.store';

/**
 * Getters read the store at call time, so a request made right after `setSession`
 * (e.g. the post-login `/auth/me`) already carries the new access token.
 */
registerSessionBridge({
  getAccessToken: () => useSessionStore.getState().accessToken,
  getRefreshToken: () => useSessionStore.getState().refreshToken,
  rotateTokens: (tokens) => useSessionStore.getState().rotateTokens(tokens),
  clearSession: () => useSessionStore.getState().clearSession(),
});

type SessionBridgeRegistrarProps = {
  children: ReactNode;
};

/**
 * Connects identity session state to the shared API client, hydrates SecureStore
 * on cold start, and confirms a restored session with GET /auth/me (refreshing once if needed).
 */
export function SessionBridgeRegistrar({ children }: SessionBridgeRegistrarProps) {
  const hydrate = useSessionStore((state) => state.hydrate);
  const clearSession = useSessionStore((state) => state.clearSession);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      await hydrate();
      if (cancelled) {
        return;
      }

      if (hasSessionTokens()) {
        try {
          // Confirms relaunch restore; 401 → client refresh once → clear if still dead.
          const me = await fetchMe();
          if (cancelled) {
            return;
          }
          useSessionStore.getState().setProfile(profileFromUser(me));
          appQueryClient.setQueryData(authMeQueryKey, me);
        } catch {
          if (!cancelled) {
            await clearSession();
          }
        }
      }

      if (!cancelled) {
        setReady(true);
        await SplashScreen.hideAsync().catch(() => undefined);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearSession, hydrate]);

  if (!ready) {
    return null;
  }

  return children;
}
