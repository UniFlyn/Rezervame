/** Live API on Render — default for Web and Mobile unless overridden in env. */
export const LIVE_API_BASE = "https://rezervame.onrender.com/api";

/** Browser / SSR API base. Set `NEXT_PUBLIC_API_BASE_URL` only to point at local Nest (`http://127.0.0.1:4000/api`). */
export function resolveApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return LIVE_API_BASE;
}
