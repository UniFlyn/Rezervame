/**
 * Build a valid Prisma DATABASE_URL when the password has # * @ etc.
 * Usage: node scripts/lib/database-url.mjs
 * Env: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, PGSSLMODE=require
 */
export function buildDatabaseUrl({
  host,
  port = '5432',
  user,
  password,
  database,
  sslmode = 'require',
}) {
  if (!host || !user || password == null || !database) {
    throw new Error('Missing host, user, password, or database');
  }
  const encUser = encodeURIComponent(user);
  const encPass = encodeURIComponent(password);
  const q = sslmode ? `?sslmode=${encodeURIComponent(sslmode)}` : '';
  return `postgresql://${encUser}:${encPass}@${host}:${port}/${database}${q}`;
}

export function parseDatabaseUrl(url) {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: u.port || '5432',
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      sslmode: u.searchParams.get('sslmode') || 'require',
    };
  } catch {
    throw new Error('Invalid DATABASE_URL — encode # as %23 and * as %2A in the password');
  }
}

if (process.argv[1] && process.argv[1].endsWith('database-url.mjs')) {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    console.log(parseDatabaseUrl(url));
  } else {
    console.log(
      buildDatabaseUrl({
        host: process.env.PGHOST,
        port: process.env.PGPORT || '5432',
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
        sslmode: process.env.PGSSLMODE || 'require',
      }),
    );
  }
}
