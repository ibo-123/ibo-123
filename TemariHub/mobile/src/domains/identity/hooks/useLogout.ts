import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { logout as logoutRequest } from '../api';
import { useSessionStore } from '../session.store';

/**
 * Signs Selam out: `POST /auth/logout` when possible, then always clears
 * SecureStore + in-memory tokens + TanStack Query cache.
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useSessionStore((state) => state.clearSession);
  const inFlight = useRef(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const refreshToken = useSessionStore.getState().refreshToken;
      if (refreshToken) {
        try {
          await logoutRequest(refreshToken);
        } catch {
          // Network / already-revoked: still wipe the device session.
        }
      }
      await clearSession();
      queryClient.clear();
    },
  });

  const { mutateAsync } = mutation;

  const logout = useCallback(async (): Promise<void> => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    try {
      await mutateAsync();
    } finally {
      inFlight.current = false;
    }
  }, [mutateAsync]);

  return { logout, isPending: mutation.isPending };
}
