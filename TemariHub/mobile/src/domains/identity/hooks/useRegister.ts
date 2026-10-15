import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { ApiError } from '@/shared/api/errors';

import { register, sendPhoneOtp } from '../api';
import { isRegisterResponse, isSendOtpResponse, readSendOtpExpiresIn } from '../schemas';
import { useSessionStore } from '../session.store';
import type { RegisterOutcome, RegisterRequest } from '../types';

/** Patchy 3G: give up before the spinner feels frozen, and say so. */
const REGISTER_TIMEOUT_MS = 20_000;

export type RegisterErrorField = 'phone_number' | 'password' | 'full_name';

export type RegisterErrorView = {
  field?: RegisterErrorField;
  code?: string;
  message: string;
  /** PHONE_TAKEN — show “Log in instead” under the phone field. */
  showLoginInstead?: boolean;
};

class RegisterClientError extends Error {
  constructor(readonly kind: 'timeout' | 'invalid_response' | 'otp_failed') {
    super(kind);
    this.name = 'RegisterClientError';
  }
}

const STATUS_FALLBACK: Record<number, string> = {
  409: 'An account with this phone number already exists.',
  429: 'Too many attempts. Wait a minute and try again.',
};

function looksLikePhoneTaken(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('already exists') || (lower.includes('phone') && lower.includes('taken'));
}

function looksLikeWeakPassword(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('password') &&
    (lower.includes('weak') || lower.includes('strong') || lower.includes('short'))
  );
}

/** Surfaces the contract message as-is; maps codes to fields for inline errors. */
export function describeRegisterError(error: unknown): RegisterErrorView {
  if (error instanceof RegisterClientError) {
    if (error.kind === 'timeout') {
      return {
        message: 'This is taking too long. Check your connection and try again.',
      };
    }
    if (error.kind === 'otp_failed') {
      return {
        message: 'Account created, but we couldn’t text the code. Wait a moment and try again.',
      };
    }
    return { message: 'We couldn’t create your account. Please try again.' };
  }

  if (error instanceof ApiError) {
    const serverMessage =
      error.message && error.message !== 'Request failed' ? error.message : null;
    const message =
      serverMessage ??
      STATUS_FALLBACK[error.status] ??
      (error.status >= 500
        ? 'Something went wrong on our side. Please try again.'
        : 'We couldn’t create your account. Please try again.');

    if (error.code === 'PHONE_TAKEN' || (error.status === 409 && looksLikePhoneTaken(message))) {
      return {
        field: 'phone_number',
        code: 'PHONE_TAKEN',
        message,
        showLoginInstead: true,
      };
    }
    if (error.code === 'INVALID_PHONE_NUMBER') {
      return { field: 'phone_number', code: error.code, message };
    }
    if (error.code === 'WEAK_PASSWORD' || looksLikeWeakPassword(message)) {
      return { field: 'password', code: 'WEAK_PASSWORD', message };
    }
    if (looksLikePhoneTaken(message)) {
      return {
        field: 'phone_number',
        code: 'PHONE_TAKEN',
        message,
        showLoginInstead: true,
      };
    }

    return { code: error.code, message };
  }

  return { message: 'Can’t reach TemariHub. Check your connection and try again.' };
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REGISTER_TIMEOUT_MS);
  try {
    return await run(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new RegisterClientError('timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * G13: register the account, then explicitly send the OTP.
 * Never assumes register texts the code.
 */
async function runRegister(input: RegisterRequest): Promise<RegisterOutcome> {
  const registered = await withTimeout((signal) => register(input, signal));
  if (!isRegisterResponse(registered)) {
    throw new RegisterClientError('invalid_response');
  }

  let otpBody: unknown;
  try {
    otpBody = await withTimeout((signal) =>
      sendPhoneOtp({ phone_number: input.phone_number }, signal),
    );
  } catch (error) {
    if (error instanceof RegisterClientError) {
      throw error;
    }
    throw new RegisterClientError('otp_failed');
  }

  if (!isSendOtpResponse(otpBody)) {
    throw new RegisterClientError('invalid_response');
  }

  const expiresIn = readSendOtpExpiresIn(otpBody);
  if (expiresIn === null) {
    throw new RegisterClientError('invalid_response');
  }

  await useSessionStore.getState().setPendingVerification(input.phone_number, expiresIn);

  return {
    phone_number: input.phone_number,
    expires_in: expiresIn,
  };
}

/**
 * Contract §4.1 + §5.1 phone register.
 * `submit` resolves `null` when a request is already in flight (double tap / Go).
 */
export function useRegister() {
  const inFlight = useRef(false);

  const mutation = useMutation({
    mutationFn: (input: RegisterRequest) => runRegister(input),
  });
  const { mutateAsync } = mutation;

  const submit = useCallback(
    async (input: RegisterRequest): Promise<RegisterOutcome | null> => {
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
