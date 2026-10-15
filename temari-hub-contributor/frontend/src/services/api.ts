const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiFailure = {
  success: false;
  message?: string;
};

export class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiRequestError('Unable to reach the server', 0);
  }

  let body: ApiSuccess<T> | ApiFailure | null = null;

  try {
    body = (await response.json()) as ApiSuccess<T> | ApiFailure;
  } catch {
    body = null;
  }

  if (!response.ok || !body || body.success === false) {
    const message = body && 'message' in body && body.message ? body.message : 'Request failed';
    throw new ApiRequestError(message, response.status);
  }

  return body.data;
}

export async function apiDownload(path: string): Promise<Blob> {
  const token = localStorage.getItem('token');
  const headers = new Headers();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch {
    throw new ApiRequestError('Unable to reach the server', 0);
  }

  if (!response.ok) {
    let message = 'Request failed';

    try {
      const body = (await response.json()) as ApiFailure;
      if (body.message) {
        message = body.message;
      }
    } catch {
      message = 'Request failed';
    }

    throw new ApiRequestError(message, response.status);
  }

  return response.blob();
}
