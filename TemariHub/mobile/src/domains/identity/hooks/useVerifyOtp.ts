import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { ApiError } from '@/shared/api/errors';

import { profileFromUser } from '../authDestination';
import { fetchMe, sendPhoneOtp, verifyPhoneOtp } from '../api';
import { isSendOtpResponse, readSendOtpExpiresIn, readVerifyOtpSession } from '../schemas';
import { useSessionStore } from '../session.store';
import type { SendOtpRequest, VerifyOtpOutcome, VerifyOtpRequest } from '../types';
import { authMeQueryKey } from './useMe';

const VERIFY_TIMEOUT_MS = 20_000;

export type VerifyOtpErrorCode = 'INVALID_OTP' | 'OTP_EXPIRED' | 'TOO_MANY_ATTEMPTS';

export type VerifyOtpErrorView = {
  code?: VerifyOtpErrorCode | string;
  message: string;
  /** Lock the inputs until she requests a new code. */
  locked?: boolean;
};

class VerifyClientError extends Error {
  constructor(readonly kind: 'timeout' | 'invalid_response') {
    super(kind);
    this.name = 'VerifyClientError';
  }
}

function looksLikeExpired(message: string): boolean {
  return message.toLowerCase().includes('expir');
}

function looksLikeLocked(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('too many') || lower.includes('locked');
}

/** Maps G14 codes (and Django message fallbacks) for the verify screen. */
export function describeVerifyOtpError(error: unknown): VerifyOtpErrorView {
  if (error instanceof VerifyClientError) {
    return {
      message:
        error.kind === 'timeout'
          ? 'This is taking too long. Check your connection and try again.'
          : 'We couldn’t verify that code. Please try again.',
    };
  }

  if (error instanceof ApiError) {
    const serverMessage =
      error.message && error.message !== 'Request failed' ? error.message : null;
    const message =
      serverMessage ??
      (error.status === 429
        ? 'Too many tries. Request a new code.'
        : error.status >= 500
          ? 'Something went wrong on our side. Please try again.'
          : 'We couldn’t verify that code. Please try again.');

    if (error.code === 'TOO_MANY_ATTEMPTS' || error.status === 429 || looksLikeLocked(message)) {
      return { code: 'TOO_MANY_ATTEMPTS', message, locked: true };
    }
    if (error.code === 'OTP_EXPIRED' || looksLikeExpired(message)) {
      return { code: 'OTP_EXPIRED', message };
    }
    if (error.code === 'INVALID_OTP') {
      return { code: 'INVALID_OTP', message };
    }
    return { code: error.code, message };
  }

  return { message: 'Can’t reach TemariHub. Check your connection and try again.' };
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    return await run(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new VerifyClientError('timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Contract §5.2 phone OTP verify + §5.1 resend.
 * Double-tap safe on both actions.
 */
export function useVerifyOtp() {
  const queryClient = useQueryClient();
  const verifyInFlight = useRef(false);
  const resendInFlight = useRef(false);

  const verifyMutation = useMutation({
    mutationFn: async (input: VerifyOtpRequest) => {
      const response = await withTimeout((signal) => verifyPhoneOtp(input, signal));
      const session = readVerifyOtpSession(response);
      if (!session) {
        throw new VerifyClientError('invalid_response');
      }

      queryClient.clear();
      const { setSession, setProfile } = useSessionStore.getState();
      await setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });

      try {
        const me = await queryClient.fetchQuery({ queryKey: authMeQueryKey, queryFn: fetchMe });
        setProfile(profileFromUser(me));
        return { onboarded: me.onboarded } satisfies VerifyOtpOutcome;
      } catch {
        // OTP already succeeded. Route from the verify payload if /auth/me blips.
        setProfile({
          onboarded: session.onboarded,
          phoneVerified: true,
          phoneNumber: input.phone_number,
        });
        return { onboarded: session.onboarded } satisfies VerifyOtpOutcome;
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (input: SendOtpRequest) => {
      const response = await withTimeout((signal) => sendPhoneOtp(input, signal));
      if (!isSendOtpResponse(response)) {
        throw new VerifyClientError('invalid_response');
      }
      const expiresIn = readSendOtpExpiresIn(response);
      if (expiresIn === null) {
        throw new VerifyClientError('invalid_response');
      }
      return { expires_in: expiresIn };
    },
  });

  const { mutateAsync: verifyAsync } = verifyMutation;
  const { mutateAsync: resendAsync } = resendMutation;

  const verify = useCallback(
    async (input: VerifyOtpRequest): Promise<VerifyOtpOutcome | null> => {
      if (verifyInFlight.current) {
        return null;
      }
      verifyInFlight.current = true;
      try {
        return await verifyAsync(input);
      } finally {
        verifyInFlight.current = false;
      }
    },
    [verifyAsync],
  );

  const resend = useCallback(
    async (input: SendOtpRequest): Promise<{ expires_in: number } | null> => {
      if (resendInFlight.current) {
        return null;
      }
      resendInFlight.current = true;
      try {
        return await resendAsync(input);
      } finally {
        resendInFlight.current = false;
      }
    },
    [resendAsync],
  );

  return {
    verify,
    resend,
    isVerifying: verifyMutation.isPending,
    isResending: resendMutation.isPending,
  };
}
