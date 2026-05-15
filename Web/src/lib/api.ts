const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

/** Prevents the UI hanging indefinitely when the API is down or unreachable (browser fetch has no default timeout). */
const DEFAULT_FETCH_TIMEOUT_MS = 25_000;

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: unknown) {
    const aborted =
      typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      (err as { name: string }).name === 'AbortError';
    if (aborted) {
      const origin = API_BASE.replace(/\/api\/?$/, '');
      throw new Error(
        `Request timed out after ${DEFAULT_FETCH_TIMEOUT_MS / 1000}s. Start the backend (e.g. port 4000) or set NEXT_PUBLIC_API_BASE_URL. Expected API: ${origin}`,
      );
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}

async function errorMessage(res: Response): Promise<string> {
  const text = await res.text();
  try {
    const j = JSON.parse(text) as { message?: string | string[] };
    if (typeof j.message === 'string') return j.message;
    if (Array.isArray(j.message)) return j.message.join(', ');
  } catch {
    //
  }
  return text || `${res.status} ${res.statusText}`;
}

function buildHeaders(role?: 'ADMIN' | 'BUSINESS' | 'USER'): Record<string, string> {
  const h: Record<string, string> = {};
  if (role) h['x-role'] = role;
  if (typeof window === 'undefined') return h;
  let token: string | null = null;
  if (role === 'USER') token = localStorage.getItem('rezervame_token');
  else if (role === 'BUSINESS') token = localStorage.getItem('business_token');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export async function apiGet<T>(path: string, role?: 'ADMIN' | 'BUSINESS' | 'USER'): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    headers: buildHeaders(role),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, role?: 'ADMIN' | 'BUSINESS' | 'USER'): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildHeaders(role) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<T>;
}

export async function apiPostOptional<T>(
  path: string,
  body: unknown,
  role?: 'ADMIN' | 'BUSINESS' | 'USER',
): Promise<T | null> {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildHeaders(role) },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown, role?: 'ADMIN' | 'BUSINESS' | 'USER'): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...buildHeaders(role) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string, role?: 'ADMIN' | 'BUSINESS' | 'USER'): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(role),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
}
