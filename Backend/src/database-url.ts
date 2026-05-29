/**
 * Normalize DATABASE_URL for cloud Postgres (Neon, etc.) before Prisma connects.
 */
export function normalizeDatabaseUrl(): void {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return;

  let url = raw;
  const isNeon = url.includes('neon.tech');
  const isSupabase = url.includes('supabase.co') || url.includes('pooler.supabase.com');
  const isRemote =
    isNeon ||
    isSupabase ||
    (!url.includes('localhost') && !url.includes('127.0.0.1'));

  if (isRemote && !/[?&]sslmode=/i.test(url)) {
    url += url.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }

  if (isNeon && !/[?&]connect_timeout=/i.test(url)) {
    url += url.includes('?') ? '&connect_timeout=15' : '?connect_timeout=15';
  }

  // Supabase pooler (port 6543) — required for Prisma with PgBouncer transaction mode
  if (isSupabase && /:6543\//.test(url) && !/[?&]pgbouncer=/i.test(url)) {
    url += url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
  }

  process.env.DATABASE_URL = url;
}
