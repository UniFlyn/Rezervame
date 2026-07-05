/** Sub-path deploy prefix (e.g. `/new`). Baked in at build via `next.config.mjs`. */
export const PUBLIC_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export function withPublicBasePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (/^https?:\/\//i.test(p)) return p;
  return `${PUBLIC_BASE_PATH}${p}`;
}

/** Internal app route (respects `/new` deploy prefix). */
export function appPath(path: string): string {
  return withPublicBasePath(path.startsWith("/") ? path : `/${path}`);
}
