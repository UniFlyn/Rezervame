const API_BASE = 'https://rezervame-backend.onrender.com/api';

/** Prevents the UI hanging indefinitely when the API is down or unreachable (browser fetch has no default timeout). */
const DEFAULT_FETCH_TIMEOUT_MS = 60_000;

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
      const origin = 'https://rezervame-backend.onrender.com/api'.replace(/\/api\/?$/, '');
      throw new Error(
        `Request timed out after ${DEFAULT_FETCH_TIMEOUT_MS / 1000}s. Start the backend or wait for cold-start (up to 50s). Expected API: ${origin}`,
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
  const text = await res.text();
  if (!text || !text.trim()) {
    throw new Error(`Empty response from server at ${path}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Invalid JSON from ${path}: ${text.slice(0, 100)}...`);
  }
}

export async function apiPost<T>(path: string, body: unknown, role?: 'ADMIN' | 'BUSINESS' | 'USER'): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildHeaders(role) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  const text = await res.text();
  if (!text || !text.trim()) throw new Error(`Empty response from server at ${path}`);
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Invalid JSON from ${path}: ${text.slice(0, 100)}...`);
  }
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
  const text = await res.text();
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    return null;
  }
}

export async function apiPatch<T>(path: string, body: unknown, role?: 'ADMIN' | 'BUSINESS' | 'USER'): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...buildHeaders(role) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
  const text = await res.text();
  if (!text || !text.trim()) throw new Error(`Empty response from server at ${path}`);
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new Error(`Invalid JSON from ${path}: ${text.slice(0, 100)}...`);
  }
}

export async function apiDelete(path: string, role?: 'ADMIN' | 'BUSINESS' | 'USER'): Promise<void> {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(role),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
}
