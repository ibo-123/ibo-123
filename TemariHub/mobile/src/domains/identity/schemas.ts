import type {
  ChangePasswordResult,
  CurrentUser,
  LoginResponse,
  OnboardingResult,
  RegisterResponse,
  SendOtpResponse,
} from './types';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

/** Live Django wraps payloads in `{ success, message, data }`; mocks return the contract body. */
export function unwrapApiData(value: unknown): unknown {
  const body = asRecord(value);
  if (!body || body.success !== true || !('data' in body)) {
    return value;
  }
  return body.data;
}

/** Contract §6 — guards token writes against a drifted or partial response. */
export function isLoginResponse(value: unknown): value is LoginResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const body = value as Record<string, unknown>;
  if (body.requires_2fa === true) {
    return true;
  }
  return (
    body.requires_2fa === false &&
    isNonEmptyString(body.access_token) &&
    isNonEmptyString(body.refresh_token)
  );
}

/** Contract §4.1 */
export function isRegisterResponse(value: unknown): value is RegisterResponse {
  const body = asRecord(unwrapApiData(value));
  if (!body) {
    return false;
  }
  return (
    isNonEmptyString(body.id) &&
    isNonEmptyString(body.phone_number) &&
    isNonEmptyString(body.full_name) &&
    typeof body.phone_verified === 'boolean' &&
    typeof body.onboarded === 'boolean'
  );
}

/** Contract §5.1 — `expires_in` may sit on the root or inside `data`. */
export function isSendOtpResponse(value: unknown): value is SendOtpResponse {
  const root = asRecord(value);
  if (!root) {
    return false;
  }

  if (typeof root.expires_in === 'number' && root.expires_in > 0) {
    return true;
  }

  const data = asRecord(root.data);
  return Boolean(data && typeof data.expires_in === 'number' && data.expires_in > 0);
}

/** Contract §10 / Django `{ success, data }` — the shape GET /auth/me actually returns. */
export function readCurrentUser(value: unknown): CurrentUser | null {
  const body = asRecord(unwrapApiData(value));
  if (!body || !isNonEmptyString(body.id) || typeof body.onboarded !== 'boolean') {
    return null;
  }

  const fullName = isNonEmptyString(body.full_name)
    ? body.full_name
    : [body.first_name, body.last_name].filter(isNonEmptyString).join(' ');
  if (!fullName) {
    return null;
  }

  const authProviders = Array.isArray(body.auth_providers)
    ? body.auth_providers.filter(isNonEmptyString)
    : undefined;

  return {
    id: body.id,
    full_name: fullName,
    onboarded: body.onboarded,
    phone_number: isNonEmptyString(body.phone_number) ? body.phone_number : undefined,
    email: isNonEmptyString(body.email) ? body.email : undefined,
    email_verified: typeof body.email_verified === 'boolean' ? body.email_verified : undefined,
    phone_verified: typeof body.phone_verified === 'boolean' ? body.phone_verified : undefined,
    two_factor_enabled:
      typeof body.two_factor_enabled === 'boolean' ? body.two_factor_enabled : undefined,
    grade: typeof body.grade === 'number' ? body.grade : undefined,
    stream: isNonEmptyString(body.stream) ? body.stream : undefined,
    auth_providers: authProviders?.length ? authProviders : undefined,
  };
}

/**
 * Contract §12 / Django `{ data: { tokens: { access, refresh } } }`.
 * After a successful change the server revokes old refresh tokens — rotate immediately.
 */
export function readChangePasswordTokens(value: unknown): ChangePasswordResult | null {
  const data = asRecord(unwrapApiData(value));
  if (!data) {
    return null;
  }

  const tokens = asRecord(data.tokens) ?? data;
  const access = tokens.access_token ?? tokens.access;
  const refresh = tokens.refresh_token ?? tokens.refresh;
  if (!isNonEmptyString(access) || !isNonEmptyString(refresh)) {
    return null;
  }

  return { accessToken: access, refreshToken: refresh };
}

/** Contract §11, flat or inside the Django `data` envelope. */
export function readOnboardingResult(value: unknown): OnboardingResult | null {
  const body = asRecord(unwrapApiData(value));
  if (
    !body ||
    body.onboarded !== true ||
    typeof body.grade !== 'number' ||
    !isNonEmptyString(body.stream)
  ) {
    return null;
  }
  return { onboarded: true, grade: body.grade, stream: body.stream };
}

export function readSendOtpExpiresIn(value: unknown): number | null {
  const root = asRecord(value);
  if (!root) {
    return null;
  }
  if (typeof root.expires_in === 'number' && root.expires_in > 0) {
    return root.expires_in;
  }
  const data = asRecord(root.data);
  return data && typeof data.expires_in === 'number' && data.expires_in > 0
    ? data.expires_in
    : null;
}

export type VerifyOtpSession = {
  accessToken: string;
  refreshToken: string;
  onboarded: boolean;
};

/**
 * Contract §5.2 (flat tokens) or today’s Django envelope
 * `{ data: { tokens: { access, refresh }, user } }`.
 */
export function readVerifyOtpSession(value: unknown): VerifyOtpSession | null {
  const root = asRecord(value);
  if (!root) {
    return null;
  }

  // Contract / mock shape
  if (isNonEmptyString(root.access_token) && isNonEmptyString(root.refresh_token)) {
    const user = asRecord(root.user);
    if (!user || typeof user.onboarded !== 'boolean') {
      return null;
    }
    return {
      accessToken: root.access_token,
      refreshToken: root.refresh_token,
      onboarded: user.onboarded,
    };
  }

  // Live Django success envelope
  const data = asRecord(unwrapApiData(value));
  if (!data) {
    return null;
  }
  const tokens = asRecord(data.tokens);
  const user = asRecord(data.user);
  const access = tokens && (tokens.access_token ?? tokens.access);
  const refresh = tokens && (tokens.refresh_token ?? tokens.refresh);
  if (
    !isNonEmptyString(access) ||
    !isNonEmptyString(refresh) ||
    !user ||
    typeof user.onboarded !== 'boolean'
  ) {
    return null;
  }
  return {
    accessToken: access,
    refreshToken: refresh,
    onboarded: user.onboarded,
  };
}
