const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'https://rezervame-kjba.onrender.com/api';

export class ApiUnauthorizedError extends Error {
  constructor() {
    super('Invalid or missing session');
    this.name = 'ApiUnauthorizedError';
  }
}

async function errorBodySnippet(res: Response): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return res.statusText;
    const t = text.length > 500 ? `${text.slice(0, 500)}…` : text;
    return t;
  } catch {
    return res.statusText;
  }
}

function adminHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'x-role': 'ADMIN' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('admin_token');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

const ADMIN_FETCH_TIMEOUT_MS = 60_000;

async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ADMIN_FETCH_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...adminHeaders(), ...(init.headers || {}) },
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (err: unknown) {
    const aborted =
      typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      (err as { name: string }).name === 'AbortError';
    if (aborted) {
      throw new Error('Request timed out. The API may be waking up — try again in a few seconds.');
    }
    throw new Error(
      err instanceof Error
        ? err.message === 'Failed to fetch'
          ? `Cannot reach API (${API_BASE}). Check that the backend is online.`
          : err.message
        : 'Network error',
    );
  } finally {
    clearTimeout(timer);
  }
}

function clearAdminSessionAndRedirect(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_token');
  const path = window.location.pathname || '';
  if (!path.startsWith('/admin/login')) {
    window.location.replace('/admin/login');
  }
}

async function assertOk(res: Response, method: string, path: string): Promise<void> {
  if (res.status === 401) {
    clearAdminSessionAndRedirect();
    throw new ApiUnauthorizedError();
  }
  if (!res.ok) {
    throw new Error(`${method} ${path} failed (${res.status}): ${await errorBodySnippet(res)}`);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await adminFetch(path);
  await assertOk(res, 'GET', path);
  return res.json() as Promise<T>;
}

export async function apiPostOptional<T>(path: string, body: unknown): Promise<T | null> {
  const res = await adminFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await adminFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await assertOk(res, 'POST', path);
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const res = await adminFetch(path, { method: 'DELETE' });
  await assertOk(res, 'DELETE', path);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await adminFetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await assertOk(res, 'PATCH', path);
  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await adminFetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await assertOk(res, 'PUT', path);
  return res.json() as Promise<T>;
}
