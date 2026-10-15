import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { ApiError } from '@/shared/api/errors';

import { changePassword } from '../api';
import { readChangePasswordTokens } from '../schemas';
import { useSessionStore } from '../session.store';
import type { ChangePasswordRequest, ChangePasswordResult } from '../types';

const CHANGE_PASSWORD_TIMEOUT_MS = 20_000;

export type ChangePasswordErrorField = 'current_password' | 'new_password' | 'new_password_confirm';

export type ChangePasswordErrorView = {
  field?: ChangePasswordErrorField;
  code?: string;
  message: string;
};

class ChangePasswordClientError extends Error {
  constructor(readonly kind: 'timeout' | 'invalid_response') {
    super(kind);
    this.name = 'ChangePasswordClientError';
  }
}

function looksLikeWeakPassword(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('password') &&
    (lower.includes('weak') ||
      lower.includes('strong') ||
      lower.includes('short') ||
      lower.includes('common') ||
      lower.includes('similar'))
  );
}

function looksLikeWrongCurrent(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('current password') ||
    (lower.includes('incorrect') && lower.includes('password')) ||
    lower.includes('old_password')
  );
}

function looksLikeSamePassword(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('differ') || lower.includes('same as');
}

function looksLikeMismatch(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('do not match') || lower.includes("don't match");
}

/** Surfaces the contract / Django message; maps codes + heuristics to fields. */
export function describeChangePasswordError(error: unknown): ChangePasswordErrorView {
  if (error instanceof ChangePasswordClientError) {
    return {
      message:
        error.kind === 'timeout'
          ? 'This is taking too long. Check your connection and try again.'
          : 'We couldn’t change your password. Please try again.',
    };
  }

  if (error instanceof ApiError) {
    const serverMessage =
      error.message && error.message !== 'Request failed' ? error.message : null;
    const message =
      serverMessage ??
      (error.status === 429
        ? 'Too many attempts. Wait a minute and try again.'
        : error.status >= 500
          ? 'Something went wrong on our side. Please try again.'
          : 'We couldn’t change your password. Please try again.');

    if (error.code === 'WEAK_PASSWORD' || looksLikeWeakPassword(message)) {
      return { field: 'new_password', code: 'WEAK_PASSWORD', message };
    }
    if (error.code === 'WRONG_PASSWORD' || looksLikeWrongCurrent(message)) {
      return { field: 'current_password', code: error.code || 'WRONG_PASSWORD', message };
    }
    if (looksLikeSamePassword(message)) {
      return { field: 'new_password', code: error.code, message };
    }
    if (looksLikeMismatch(message)) {
      return { field: 'new_password_confirm', code: error.code, message };
    }

    return { code: error.code, message };
  }

  return { message: 'Can’t reach TemariHub. Check your connection and try again.' };
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CHANGE_PASSWORD_TIMEOUT_MS);
  try {
    return await run(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ChangePasswordClientError('timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function runChangePassword(input: ChangePasswordRequest): Promise<ChangePasswordResult> {
  const body = await withTimeout((signal) => changePassword(input, signal));
  const tokens = readChangePasswordTokens(body);
  if (!tokens) {
    throw new ChangePasswordClientError('invalid_response');
  }

  await useSessionStore.getState().rotateTokens(tokens);
  return tokens;
}

/**
 * Contract §12 change password. Rotates SecureStore + memory tokens on success.
 * `submit` resolves `null` when a request is already in flight.
 */
export function useChangePassword() {
  const inFlight = useRef(false);

  const mutation = useMutation({
    mutationFn: (input: ChangePasswordRequest) => runChangePassword(input),
  });
  const { mutateAsync } = mutation;

  const submit = useCallback(
    async (input: ChangePasswordRequest): Promise<ChangePasswordResult | null> => {
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
