const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000/api';

let authToken: string | null = localStorage.getItem('sahaaya_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('sahaaya_token', token);
  else localStorage.removeItem('sahaaya_token');
}

export function getAuthToken() {
  return authToken;
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    setAuthToken(null);
    onUnauthorized?.();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export class ApiOfflineError extends Error {}

/** Wraps a network call so a genuine connectivity failure (vs. a server-side error) is distinguishable by callers deciding whether to queue for later sync. */
export async function apiOrOffline<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof TypeError) throw new ApiOfflineError('Network request failed');
    throw err;
  }
}
