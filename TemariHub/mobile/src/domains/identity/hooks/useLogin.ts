import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { ApiError } from '@/shared/api/errors';

import { profileFromUser } from '../authDestination';
import { fetchMe, login } from '../api';
import { isLoginResponse } from '../schemas';
import { useSessionStore } from '../session.store';
import type { LoginOutcome, LoginRequest } from '../types';
import { authMeQueryKey } from './useMe';

/** Patchy 3G: give up before the spinner feels frozen, and say so. */
const LOGIN_TIMEOUT_MS = 20_000;

export type LoginErrorView = {
  /** Set when the message belongs under a specific field. */
  field?: 'phone_number';
  message: string;
};

class LoginClientError extends Error {
  constructor(readonly kind: 'timeout' | 'invalid_response') {
    super(kind);
    this.name = 'LoginClientError';
  }
}

const STATUS_FALLBACK: Record<number, string> = {
  401: 'Wrong phone number or password.',
  403: 'This account can’t sign in right now.',
  429: 'Too many attempts. Wait a minute and try again.',
};

/** Surfaces the contract message as-is; local copy only when the server sent none. */
export function describeLoginError(error: unknown): LoginErrorView {
  if (error instanceof LoginClientError) {
    return {
      message:
        error.kind === 'timeout'
          ? 'This is taking too long. Check your connection and try again.'
          : 'We couldn’t sign you in. Please try again.',
    };
  }

  if (error instanceof ApiError) {
    const serverMessage =
      error.message && error.message !== 'Request failed' ? error.message : null;
    const message =
      serverMessage ??
      STATUS_FALLBACK[error.status] ??
      (error.status >= 500
        ? 'Something went wrong on our side. Please try again.'
        : 'We couldn’t sign you in. Please try again.');

    return error.code === 'INVALID_PHONE_NUMBER' ? { field: 'phone_number', message } : { message };
  }

  return { message: 'Can’t reach TemariHub. Check your connection and try again.' };
}

async function requestLogin(input: LoginRequest): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);
  try {
    return await login(input, controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new LoginClientError('timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function runLogin(input: LoginRequest, queryClient: QueryClient): Promise<LoginOutcome> {
  const response = await requestLogin(input);

  if (!isLoginResponse(response)) {
    throw new LoginClientError('invalid_response');
  }

  // Phase 2 owns the challenge UI. The token is not stored; relaunch returns to Login.
  if (response.requires_2fa) {
    useSessionStore.getState().setTwoFactorPending(true);
    return { status: 'two_factor_required' };
  }

  // Shared phone: never show the previous student's cached data to the next one.
  queryClient.clear();

  const { setSession, setProfile, clearSession } = useSessionStore.getState();
  await setSession({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  });

  try {
    const me = await queryClient.fetchQuery({ queryKey: authMeQueryKey, queryFn: fetchMe });
    setProfile(profileFromUser(me));
    return { status: 'signed_in', onboarded: me.onboarded };
  } catch (error) {
    // Can't route without knowing `onboarded`; don't leave a half-signed-in session behind.
    await clearSession();
    throw error;
  }
}

/**
 * Contract §6 phone + password login.
 * `submit` resolves `null` when a request is already in flight, so a double tap or
 * tap + keyboard "Go" never sends twice.
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);

  const mutation = useMutation({
    mutationFn: (input: LoginRequest) => runLogin(input, queryClient),
  });
  const { mutateAsync } = mutation;

  const submit = useCallback(
    async (input: LoginRequest): Promise<LoginOutcome | null> => {
      if (inFlight.current) {
        return null;
      }
      inFlight.current = true;
      try {
        return await mutateAsync(input);
      } finally {
        inFlight.current = false;
      }
    },
    [mutateAsync],
  );

  return { submit, isPending: mutation.isPending };
}
