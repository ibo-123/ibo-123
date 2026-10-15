import type { SessionTokens } from './sessionBridge';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Normalizes refresh responses from:
 * - contract / mocks: `{ access_token, refresh_token }`
 * - Django envelope: `{ success, data: { access, refresh? } }`
 * When rotation omits a new refresh token, keeps `previousRefresh`.
 */
export function readRotatedTokens(
  body: unknown,
  previousRefresh: string,
): SessionTokens | null {
  const root = asRecord(body);
  if (!root) {
    return null;
  }

  if (nonEmpty(root.access_token)) {
    return {
      accessToken: root.access_token,
      refreshToken: nonEmpty(root.refresh_token) ? root.refresh_token : previousRefresh,
    };
  }

  const data = root.success === true ? asRecord(root.data) : root;
  if (!data) {
    return null;
  }

  const access = data.access_token ?? data.access;
  const refresh = data.refresh_token ?? data.refresh;
  if (!nonEmpty(access)) {
    return null;
  }

  return {
    accessToken: access,
    refreshToken: nonEmpty(refresh) ? refresh : previousRefresh,
  };
}
