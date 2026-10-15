/** Contract §3.7 — `{ error: { code, message } }` */
export type ContractErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

export function isContractErrorBody(value: unknown): value is ContractErrorBody {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const err = (value as ContractErrorBody).error;
  return Boolean(err && typeof err.code === 'string' && typeof err.message === 'string');
}

/** Current Django envelope `{ success: false, message, errors }` — not yet the §3.7 shape. */
function envelopeMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const message = (value as { message?: unknown }).message;
  return typeof message === 'string' && message.trim() ? message : null;
}

export async function parseApiError(response: Response): Promise<ApiError> {
  let message: string | null = null;
  try {
    const body: unknown = await response.json();
    if (isContractErrorBody(body)) {
      return new ApiError(body.error.code, body.error.message, response.status);
    }
    message = envelopeMessage(body);
  } catch {
    // Non-JSON or empty body — fall through.
  }

  const fallbackCode =
    response.status === 401
      ? 'UNAUTHORIZED'
      : response.status === 429
        ? 'TOO_MANY_REQUESTS'
        : 'UNKNOWN_ERROR';

  return new ApiError(
    fallbackCode,
    message ?? (response.statusText || 'Request failed'),
    response.status,
  );
}

export function contractError(code: string, message: string, status: number): ApiError {
  return new ApiError(code, message, status);
}
