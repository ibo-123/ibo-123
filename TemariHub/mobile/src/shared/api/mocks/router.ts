import { contractError } from '@/shared/api/errors';
import type { SessionBridge } from '@/shared/api/sessionBridge';

import {
  mockDashboardMe,
  mockDiagnosticAnswer,
  mockDiagnosticComplete,
  mockDiagnosticStart,
  mockPracticeSessionStart,
  mockRagChatResponse,
  mockRagConversationsPage,
  mockRateLimitedError,
} from './fixtures/assumptions';
import { mockQuestionById } from './fixtures/questions';
import {
  mockChangePasswordErrors,
  mockChangePasswordScenarios,
  mockLoginErrors,
  mockLoginNotOnboardedResponse,
  mockLoginResponse,
  mockLoginScenarios,
  mockLoginTwoFactorResponse,
  mockMe,
  mockRegisterErrors,
  mockRegisterResponse,
  mockRegisterScenarios,
  mockSendOtpResponse,
  mockSubjectsPage,
  mockVerifyOtpErrors,
  mockVerifyOtpOnboardedResponse,
  mockVerifyOtpResponse,
  mockVerifyOtpScenarios,
} from './fixtures/contract';
import {
  mockCurriculumSubjects,
  mockCurriculumTopicDetail,
  mockCurriculumTopics,
  mockCurriculumUnits,
} from './fixtures/curriculum';
import {
  mockEmailLoginResponse,
  mockEmailRegisterResponse,
  mockGoogleAuthResponse,
  mockPasswordForgotResponse,
} from './fixtures/proposed';

export type MockRequest = {
  method: string;
  path: string;
  /** Query string without `?` — client strips it from `path` for matching. */
  search?: string;
  headers: Headers;
  body: unknown;
  session: SessionBridge;
};

export type MockResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; error: ReturnType<typeof contractError> };

const EXPIRED_ACCESS = 'mock-access-expired';
const NEW_STUDENT_ACCESS = 'mock-access-new';
const ONBOARDING_GRADES = new Set([9, 10, 11, 12]);
const ONBOARDING_STREAMS = new Set(['natural_science', 'social_science']);

/** In-memory track so GET /auth/me confirms a POST /auth/onboarding in this session. */
const onboardedTracks = new Map<string, { grade: number; stream: string }>();

function studentKey(token: string): 'new' | 'selam' {
  return isNewStudentToken(token) ? 'new' : 'selam';
}

function newStudentMe(track?: { grade: number; stream: string }) {
  return {
    ...mockMe,
    id: mockRegisterResponse.id,
    full_name: mockRegisterResponse.full_name,
    phone_number: mockRegisterResponse.phone_number,
    email: undefined,
    email_verified: false,
    phone_verified: true,
    onboarded: Boolean(track),
    grade: track?.grade,
    stream: track?.stream,
    auth_providers: ['phone'] as const,
  };
}

function parseRefreshGeneration(token: string): number | null {
  const match = /^mock-refresh-(?:new-)?v(\d+)$/.exec(token);
  return match ? Number(match[1]) : null;
}

function isNewStudentToken(token: string): boolean {
  return token.includes('-new');
}

function bearerToken(headers: Headers): string | null {
  const auth = headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return null;
  }
  return auth.slice('Bearer '.length).trim();
}

/** Contract `refresh_token` or Django `refresh`. */
function readRefreshFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const record = body as { refresh_token?: unknown; refresh?: unknown };
  if (typeof record.refresh_token === 'string' && record.refresh_token) {
    return record.refresh_token;
  }
  if (typeof record.refresh === 'string' && record.refresh) {
    return record.refresh;
  }
  return null;
}

function unauthorized(message = 'Sign in to continue.'): MockResult {
  return {
    ok: false,
    error: contractError('UNAUTHORIZED', message, 401),
  };
}

/** Long enough to see the spinner and try a double tap. */
const MOCK_LOGIN_LATENCY_MS = 800;
const MOCK_REGISTER_LATENCY_MS = 600;

const ETHIOPIAN_MOBILE = /^\+251[79]\d{8}$/;
const STRONG_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function fail(error: { code: string; message: string; status: number }): MockResult {
  return { ok: false, error: contractError(error.code, error.message, error.status) };
}

async function mockLogin(body: unknown): Promise<MockResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LOGIN_LATENCY_MS));

  const { phone_number: phone, password } = (body ?? {}) as {
    phone_number?: unknown;
    password?: unknown;
  };

  if (typeof phone !== 'string' || !ETHIOPIAN_MOBILE.test(phone)) {
    return fail(mockLoginErrors.invalidPhone);
  }
  if (password === mockLoginScenarios.wrongPassword) {
    return fail(mockLoginErrors.invalidCredentials);
  }

  switch (phone) {
    case mockLoginScenarios.twoFactorPhone:
      return { ok: true, status: 200, body: mockLoginTwoFactorResponse };
    case mockLoginScenarios.disabledPhone:
      return fail(mockLoginErrors.accountDisabled);
    case mockLoginScenarios.rateLimitedPhone:
      return fail(mockLoginErrors.tooManyRequests);
    case mockLoginScenarios.unverifiedPhone:
      return fail(mockLoginErrors.phoneNotVerified);
    case mockLoginScenarios.notOnboardedPhone:
      onboardedTracks.delete('new');
      return { ok: true, status: 200, body: mockLoginNotOnboardedResponse };
    default:
      return { ok: true, status: 200, body: mockLoginResponse };
  }
}

async function mockRegister(body: unknown): Promise<MockResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_REGISTER_LATENCY_MS));

  const {
    phone_number: phone,
    password,
    full_name: fullName,
  } = (body ?? {}) as {
    phone_number?: unknown;
    password?: unknown;
    full_name?: unknown;
  };

  if (typeof phone !== 'string' || !ETHIOPIAN_MOBILE.test(phone)) {
    return fail(mockRegisterErrors.invalidPhone);
  }
  if (phone === mockRegisterScenarios.takenPhone) {
    return fail(mockRegisterErrors.phoneTaken);
  }
  if (
    typeof password !== 'string' ||
    password === mockRegisterScenarios.weakPassword ||
    !STRONG_PASSWORD.test(password)
  ) {
    return fail(mockRegisterErrors.weakPassword);
  }
  if (typeof fullName !== 'string' || !fullName.trim()) {
    return fail({
      code: 'VALIDATION_ERROR',
      message: 'Enter your full name.',
      status: 400,
    });
  }

  return {
    ok: true,
    status: 201,
    body: {
      ...mockRegisterResponse,
      phone_number: phone,
      full_name: fullName.trim(),
    },
  };
}

async function mockSendOtp(body: unknown): Promise<MockResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_REGISTER_LATENCY_MS));

  const { phone_number: phone } = (body ?? {}) as { phone_number?: unknown };
  if (typeof phone !== 'string' || !ETHIOPIAN_MOBILE.test(phone)) {
    return fail(mockRegisterErrors.invalidPhone);
  }
  if (phone === mockRegisterScenarios.takenPhone) {
    // Taken numbers already have accounts; still allow resend for QA of the OTP path.
    return { ok: true, status: 200, body: mockSendOtpResponse };
  }

  return { ok: true, status: 200, body: mockSendOtpResponse };
}

async function mockVerifyOtp(body: unknown): Promise<MockResult> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_REGISTER_LATENCY_MS));

  const { phone_number: phone, otp } = (body ?? {}) as {
    phone_number?: unknown;
    otp?: unknown;
  };

  if (typeof phone !== 'string' || !ETHIOPIAN_MOBILE.test(phone)) {
    return fail(mockRegisterErrors.invalidPhone);
  }
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return fail(mockVerifyOtpErrors.invalidOtp);
  }

  switch (otp) {
    case mockVerifyOtpScenarios.invalidCode:
      return fail(mockVerifyOtpErrors.invalidOtp);
    case mockVerifyOtpScenarios.expiredCode:
      return fail(mockVerifyOtpErrors.otpExpired);
    case mockVerifyOtpScenarios.lockedCode:
      return fail(mockVerifyOtpErrors.tooManyAttempts);
    case mockVerifyOtpScenarios.onboardedCode:
      return {
        ok: true,
        status: 200,
        body: {
          ...mockVerifyOtpOnboardedResponse,
          user: { ...mockVerifyOtpOnboardedResponse.user, phone_number: phone },
        },
      };
    default:
      onboardedTracks.delete('new');
      return {
        ok: true,
        status: 200,
        body: {
          ...mockVerifyOtpResponse,
          user: { ...mockVerifyOtpResponse.user, phone_number: phone },
        },
      };
  }
}

export async function handleMockRequest(req: MockRequest): Promise<MockResult> {
  const { method, path, search, headers, body, session } = req;
  const normalized = path.replace(/^\//, '');
  const query = new URLSearchParams(search ?? '');

  if (method === 'GET' && normalized === 'auth/me') {
    const token = bearerToken(headers) ?? session.getAccessToken();
    if (!token || token === EXPIRED_ACCESS) {
      return unauthorized();
    }
    if (isNewStudentToken(token)) {
      return { ok: true, status: 200, body: newStudentMe(onboardedTracks.get('new')) };
    }
    const selamTrack = onboardedTracks.get('selam');
    return {
      ok: true,
      status: 200,
      body: selamTrack ? { ...mockMe, ...selamTrack, onboarded: true } : mockMe,
    };
  }

  if (method === 'POST' && normalized === 'auth/onboarding') {
    await new Promise((resolve) => setTimeout(resolve, MOCK_REGISTER_LATENCY_MS));
    const token = bearerToken(headers) ?? session.getAccessToken();
    if (!token || token === EXPIRED_ACCESS) {
      return unauthorized();
    }
    const { grade, stream } = (body ?? {}) as { grade?: unknown; stream?: unknown };
    if (typeof grade !== 'number' || !ONBOARDING_GRADES.has(grade)) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Choose a grade TemariHub already teaches.',
        status: 400,
      });
    }
    if (typeof stream !== 'string' || !ONBOARDING_STREAMS.has(stream)) {
      return fail({
        code: 'VALIDATION_ERROR',
        message: 'Choose a stream TemariHub already teaches.',
        status: 400,
      });
    }
    const key = studentKey(token);
    onboardedTracks.set(key, { grade, stream });
    const user =
      key === 'new'
        ? newStudentMe({ grade, stream })
        : { ...mockMe, grade, stream, onboarded: true };
    return {
      ok: true,
      status: 200,
      body: { onboarded: true, grade, stream, user },
    };
  }

  if (method === 'POST' && normalized === 'auth/refresh') {
    const refreshToken = readRefreshFromBody(body) ?? session.getRefreshToken();

    const generation = refreshToken ? parseRefreshGeneration(refreshToken) : null;
    if (!refreshToken || generation === null) {
      return {
        ok: false,
        error: contractError('INVALID_REFRESH_TOKEN', 'Refresh token is invalid.', 401),
      };
    }

    const nextGeneration = generation + 1;
    const freshStudent = isNewStudentToken(refreshToken);
    const tokens = {
      accessToken: freshStudent ? NEW_STUDENT_ACCESS : 'mock-access-active',
      refreshToken: freshStudent
        ? `mock-refresh-new-v${nextGeneration}`
        : `mock-refresh-v${nextGeneration}`,
    };
    await session.rotateTokens(tokens);

    return {
      ok: true,
      status: 200,
      body: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        token_type: 'Bearer',
      },
    };
  }

  if (method === 'POST' && normalized === 'auth/login') {
    return mockLogin(body);
  }

  if (method === 'POST' && normalized === 'auth/register') {
    return mockRegister(body);
  }

  if (method === 'POST' && normalized === 'auth/phone/send-otp') {
    return mockSendOtp(body);
  }

  if (method === 'POST' && normalized === 'auth/phone/verify-otp') {
    return mockVerifyOtp(body);
  }

  if (method === 'POST' && normalized === 'auth/change-password') {
    await new Promise((resolve) => setTimeout(resolve, MOCK_REGISTER_LATENCY_MS));
    const token = bearerToken(headers) ?? session.getAccessToken();
    if (!token || token === EXPIRED_ACCESS) {
      return unauthorized();
    }

    const {
      current_password: currentPassword,
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: confirm,
    } = (body ?? {}) as {
      current_password?: unknown;
      old_password?: unknown;
      new_password?: unknown;
      new_password_confirm?: unknown;
    };

    const current =
      (typeof currentPassword === 'string' && currentPassword) ||
      (typeof oldPassword === 'string' && oldPassword) ||
      '';

    if (!current) {
      return fail(mockChangePasswordErrors.wrongCurrent);
    }
    if (current === mockChangePasswordScenarios.wrongCurrent) {
      return fail(mockChangePasswordErrors.wrongCurrent);
    }
    if (typeof newPassword !== 'string' || typeof confirm !== 'string') {
      return fail(mockChangePasswordErrors.mismatch);
    }
    if (newPassword !== confirm) {
      return fail(mockChangePasswordErrors.mismatch);
    }
    if (
      newPassword === mockChangePasswordScenarios.weakNew ||
      !STRONG_PASSWORD.test(newPassword)
    ) {
      return fail(mockChangePasswordErrors.weakPassword);
    }
    if (
      newPassword === mockChangePasswordScenarios.sameAsCurrent ||
      newPassword === current
    ) {
      return fail(mockChangePasswordErrors.samePassword);
    }

    const priorRefresh = session.getRefreshToken() ?? mockTokens.initialRefresh;
    const generation = parseRefreshGeneration(priorRefresh) ?? 1;
    const nextGeneration = generation + 1;
    const freshStudent = isNewStudentToken(token) || isNewStudentToken(priorRefresh);
    const tokens = {
      access_token: freshStudent ? NEW_STUDENT_ACCESS : 'mock-access-active',
      refresh_token: freshStudent
        ? `mock-refresh-new-v${nextGeneration}`
        : `mock-refresh-v${nextGeneration}`,
      token_type: 'Bearer' as const,
    };

    return {
      ok: true,
      status: 200,
      body: {
        success: true,
        message: 'Password changed successfully',
        data: { tokens },
      },
    };
  }

  if (method === 'POST' && normalized === 'auth/logout') {
    const refreshToken = readRefreshFromBody(body) ?? session.getRefreshToken();
    if (!refreshToken) {
      return fail({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is required to log out.',
        status: 400,
      });
    }
    // Server-side revoke simulated; device clear is still the client's job.
    return { ok: true, status: 204, body: null };
  }

  if (method === 'POST' && normalized === 'auth/google') {
    return { ok: true, status: 200, body: mockGoogleAuthResponse };
  }

  if (method === 'POST' && normalized === 'auth/email/register') {
    return { ok: true, status: 201, body: mockEmailRegisterResponse };
  }

  if (method === 'POST' && normalized === 'auth/email/login') {
    return { ok: true, status: 200, body: mockEmailLoginResponse };
  }

  if (method === 'POST' && normalized === 'auth/password/forgot') {
    return { ok: true, status: 202, body: mockPasswordForgotResponse };
  }

  if (method === 'GET' && normalized.startsWith('subjects')) {
    return { ok: true, status: 200, body: mockSubjectsPage };
  }

  // Contract §13.1 — filter by the student's submitted grade + stream (not a hardcoded track).
  if (method === 'GET' && (normalized === 'curriculum/subjects' || normalized === 'curriculum/subjects/')) {
    const gradeRaw = query.get('grade');
    const grade = gradeRaw != null && gradeRaw !== '' ? Number(gradeRaw) : undefined;
    const stream = query.get('stream') || undefined;
    return {
      ok: true,
      status: 200,
      body: mockCurriculumSubjects({
        grade: Number.isFinite(grade) ? grade : undefined,
        stream,
      }),
    };
  }

  {
    const unitsMatch = /^curriculum\/subjects\/([^/]+)\/units\/?$/.exec(normalized);
    if (method === 'GET' && unitsMatch) {
      const payload = mockCurriculumUnits(unitsMatch[1] ?? '');
      if (!payload) {
        return fail({ code: 'NOT_FOUND', message: 'Subject not found.', status: 404 });
      }
      return { ok: true, status: 200, body: payload };
    }
  }

  {
    const topicsMatch = /^curriculum\/units\/([^/]+)\/topics\/?$/.exec(normalized);
    if (method === 'GET' && topicsMatch) {
      const payload = mockCurriculumTopics(topicsMatch[1] ?? '');
      if (!payload) {
        return fail({ code: 'NOT_FOUND', message: 'Unit not found.', status: 404 });
      }
      return { ok: true, status: 200, body: payload };
    }
  }

  {
    const topicMatch = /^curriculum\/topics\/([^/]+)\/?$/.exec(normalized);
    if (method === 'GET' && topicMatch) {
      const payload = mockCurriculumTopicDetail(topicMatch[1] ?? '');
      if (!payload) {
        return fail({ code: 'NOT_FOUND', message: 'Topic not found.', status: 404 });
      }
      return { ok: true, status: 200, body: payload };
    }
  }

  if (method === 'GET' && normalized === 'dashboard/me') {
    return { ok: true, status: 200, body: mockDashboardMe };
  }

  if (method === 'POST' && normalized === 'practice/sessions') {
    return { ok: true, status: 201, body: mockPracticeSessionStart };
  }

  if (method === 'POST' && normalized === 'diagnostic/start') {
    return { ok: true, status: 201, body: mockDiagnosticStart };
  }

  if (method === 'POST' && /diagnostic\/[^/]+\/answer$/.test(normalized)) {
    return { ok: true, status: 200, body: mockDiagnosticAnswer };
  }

  const questionMatch = /^questions\/([^/]+)\/?$/.exec(normalized);
  if (method === 'GET' && questionMatch) {
    const payload = mockQuestionById(questionMatch[1] ?? '');
    if (!payload) {
      return fail({ code: 'NOT_FOUND', message: 'Question not found.', status: 404 });
    }
    return { ok: true, status: 200, body: payload };
  }

  if (method === 'POST' && /diagnostic\/[^/]+\/complete$/.test(normalized)) {
    return { ok: true, status: 200, body: mockDiagnosticComplete };
  }

  if (method === 'GET' && normalized.startsWith('rag/conversations')) {
    return { ok: true, status: 200, body: mockRagConversationsPage };
  }

  if (method === 'POST' && normalized === 'rag/chat') {
    return { ok: true, status: 200, body: mockRagChatResponse };
  }

  if (method === 'POST' && normalized === 'rag/chat/rate-limit-demo') {
    return {
      ok: false,
      error: contractError('RATE_LIMITED', mockRateLimitedError.error.message, 429),
    };
  }

  return {
    ok: false,
    error: contractError('NOT_FOUND', `No mock for ${method} /${normalized}`, 404),
  };
}

export const mockTokens = {
  activeAccess: 'mock-access-active',
  expiredAccess: EXPIRED_ACCESS,
  initialRefresh: 'mock-refresh-v1',
};
