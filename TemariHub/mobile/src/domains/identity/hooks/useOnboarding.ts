import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import { ApiError } from '@/shared/api/errors';

import { fetchMe, submitOnboarding } from '../api';
import { profileFromUser } from '../authDestination';
import { readOnboardingResult } from '../schemas';
import { useSessionStore } from '../session.store';
import type { CurrentUser, OnboardingRequest } from '../types';
import { authMeQueryKey } from './useMe';

const ONBOARDING_TIMEOUT_MS = 20_000;

export type OnboardingErrorView = {
  message: string;
};

class OnboardingClientError extends Error {
  constructor(readonly kind: 'timeout' | 'invalid_response' | 'unconfirmed') {
    super(kind);
    this.name = 'OnboardingClientError';
  }
}

/** Surfaces the server message; local copy only when the save or the confirm step failed. */
export function describeOnboardingError(error: unknown): OnboardingErrorView {
  if (error instanceof OnboardingClientError) {
    if (error.kind === 'timeout') {
      return { message: 'This is taking too long. Check your connection and try again.' };
    }
    if (error.kind === 'unconfirmed') {
      return { message: 'Your track didn’t stick yet. Try saving once more.' };
    }
    return { message: 'We couldn’t save your track. Please try again.' };
  }

  if (error instanceof ApiError) {
    const serverMessage =
      error.message && error.message !== 'Request failed' ? error.message : null;
    return {
      message:
        serverMessage ??
        (error.status >= 500
          ? 'Something went wrong on our side. Please try again.'
          : 'We couldn’t save your track. Please try again.'),
    };
  }

  return { message: 'Can’t reach TemariHub. Check your connection and try again.' };
}

function isConfirmed(user: CurrentUser, track: OnboardingRequest): boolean {
  return (
    user.onboarded === true && user.grade === track.grade && user.stream === track.stream
  );
}

/**
 * Contract §11. One POST, then GET /auth/me must show the same track
 * before the gate is allowed to leave this screen.
 */
async function runOnboarding(track: OnboardingRequest, signal: AbortSignal): Promise<CurrentUser> {
  const posted = await submitOnboarding(track, signal);
  if (signal.aborted) {
    throw new OnboardingClientError('timeout');
  }
  if (!readOnboardingResult(posted)) {
    throw new OnboardingClientError('invalid_response');
  }

  const me = await fetchMe();
  if (signal.aborted) {
    throw new OnboardingClientError('timeout');
  }
  if (!isConfirmed(me, track)) {
    throw new OnboardingClientError('unconfirmed');
  }
  return me;
}

/**
 * `submit` resolves `false` when a request is already in flight.
 * It throws on failure so the screen can show `describeOnboardingError`.
 */
export function useOnboarding() {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const submit = useCallback(
    async (track: OnboardingRequest): Promise<boolean> => {
      if (inFlight.current) {
        return false;
      }
      inFlight.current = true;
      setIsPending(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ONBOARDING_TIMEOUT_MS);
      try {
        const me = await runOnboarding(track, controller.signal);
        queryClient.setQueryData(authMeQueryKey, me);
        useSessionStore.getState().enterDiagnostic(profileFromUser(me));
        return true;
      } catch (error) {
        if (controller.signal.aborted) {
          throw new OnboardingClientError('timeout');
        }
        throw error;
      } finally {
        clearTimeout(timer);
        inFlight.current = false;
        setIsPending(false);
      }
    },
    [queryClient],
  );

  return { submit, isPending };
}
