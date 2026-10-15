import { env } from '@/config/env';

import { ApiError, parseApiError } from './errors';
import { handleMockRequest } from './mocks';
import { getSessionBridge } from './sessionBridge';
import { readRotatedTokens } from './tokenPair';

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Skip Authorization header (public routes). */
  skipAuth?: boolean;
  /** Aborts the network request (e.g. a timeout). Mocks ignore it. */
  signal?: AbortSignal;
  /** Internal — refresh endpoint must not recurse. */
  _isRefreshCall?: boolean;
  /** Internal — second attempt after refresh. */
  _retryAfterRefresh?: boolean;
};

let refreshInFlight: Promise<boolean> | null = null;

function buildUrl(path: string): string {
  const base = env.apiUrl.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

async function refreshAccessTokenOnce(): Promise<boolean> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const session = getSessionBridge();
    const refreshToken = session.getRefreshToken();
    if (!refreshToken) {
      return false;
    }

    try {
      // Contract uses `refresh_token`; today’s Django serializer expects `refresh`.
      const result = await requestInternal<unknown>('/auth/refresh', {
        method: 'POST',
        body: { refresh_token: refreshToken, refresh: refreshToken },
        skipAuth: true,
        _isRefreshCall: true,
      });
      const tokens = readRotatedTokens(result, refreshToken);
      if (!tokens) {
        return false;
      }
      // §9.1 — rotated refresh replaces the old one in SecureStore immediately.
      await session.rotateTokens(tokens);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function requestInternal<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const session = getSessionBridge();
  const headers = new Headers(options.headers);

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!options.skipAuth) {
    const access = session.getAccessToken();
    if (access) {
      headers.set('Authorization', `Bearer ${access}`);
    }
  }

  if (env.useMocks) {
    const stripped = path.replace(/^\//, '');
    const qIndex = stripped.indexOf('?');
    const mockPath = qIndex >= 0 ? stripped.slice(0, qIndex) : stripped;
    const search = qIndex >= 0 ? stripped.slice(qIndex + 1) : undefined;
    const mockResult = await handleMockRequest({
      method,
      path: mockPath,
      search,
      headers,
      body: options.body,
      session,
    });

    if (!mockResult.ok) {
      throw mockResult.error;
    }
    return mockResult.body as T;
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  return parseJson<T>(response);
}

async function logoutSelam(): Promise<void> {
  const session = getSessionBridge();
  await session.clearSession();
}

/**
 * Shared JSON client for `/api/v1`.
 * 401 → one refresh → single retry; otherwise session is cleared (logout).
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  try {
    return await requestInternal<T>(path, options);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    if (options.skipAuth) {
      throw error;
    }

    if (options._retryAfterRefresh) {
      await logoutSelam();
      throw error;
    }

    const refreshed = await refreshAccessTokenOnce();
    if (!refreshed) {
      await logoutSelam();
      throw error;
    }

    try {
      return await requestInternal<T>(path, { ...options, _retryAfterRefresh: true });
    } catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401) {
        await logoutSelam();
      }
      throw retryError;
    }
  }
}

export { ApiError };
