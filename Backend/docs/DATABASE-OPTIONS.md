# Free PostgreSQL options for Rezervame

## Two databases (local + cloud)

| Environment | Who sets `DATABASE_URL` | Typical host |
|-------------|-------------------------|--------------|
| **Local dev** | `Backend/.env` | `localhost:5432` (Docker / Postgres.app) |
| **Production** | Render → Environment | Neon, Supabase (AWS), or Render Postgres |

**Apps (Web + Mobile)** default to the **live API** (`https://rezervame.onrender.com/api`), which uses the **cloud** database. Your machine’s Postgres is only used when you run Nest locally with `Backend/.env` pointing at `localhost`.

Sync schema to cloud after migrations:

```bash
cd Backend && DATABASE_URL="<cloud-url>" npx prisma migrate deploy
```

Copy data local → cloud: `./scripts/migrate-database.sh "<local-url>" "<cloud-url>"` (see below).

---

Production health shows `postgres: error` when `DATABASE_URL` is wrong, Neon is suspended, or SSL/pooler settings are incorrect.

## Recommended: Supabase (free, no 30-day delete)

Best long-term free tier for Render + Prisma.

1. Go to [supabase.com](https://supabase.com) → **New project** (choose region close to Render, e.g. `us-east-1`).
2. Wait for the project to finish provisioning.
3. **Project Settings → Database**:
   - **Connection string → URI** (direct, port `5432`) → save as `DIRECT_DATABASE_URL` (migrations).
   - **Connection pooling → Transaction mode** (port `6543`) → save as `DATABASE_URL` (runtime on Render).
4. Replace `[YOUR-PASSWORD]` in both URLs.
5. Append if missing: `?sslmode=require` (direct) and `?pgbouncer=true&sslmode=require` (pooler).

**Render environment:**

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Pooled URI (port **6543**, `pgbouncer=true`) |
| `DIRECT_DATABASE_URL` | Direct URI (port **5432**) — optional but recommended for `prisma migrate deploy` |

6. Redeploy Render → **Clear build cache**.
7. Migrate data (from local DB):

```bash
# From repo root — local → Supabase
./scripts/migrate-database.sh "postgresql://premkumar@localhost:5432/rezervame" "postgresql://postgres.[ref]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
```

8. Verify: `node scripts/check-production-api.mjs` → `"postgres": "ok"`.

**Limits:** ~500 MB storage, pauses after 1 week inactivity (resume in dashboard).

---

## Option B: Render Postgres (same platform as API)

Defined in root `render.yaml`. Good latency between API and DB; **free DB expires after 30 days** (export with `pg_dump` before expiry).

1. Render Dashboard → **New → Blueprint** (or update existing service from repo).
2. Apply `render.yaml` — creates `rezervame-db` and wires `DATABASE_URL` automatically.
3. Run migration script from local data once the DB exists:

```bash
./scripts/migrate-database.sh "postgresql://premkumar@localhost:5432/rezervame" "<Render External Database URL>"
```

Get **External Database URL** from Render → `rezervame-db` → Connect.

---

## Option C: Fix Neon (keep current provider)

1. [console.neon.tech](https://console.neon.tech) → resume project if **Suspended**.
2. Copy **Pooled connection** string (host contains `-pooler`).
3. Ensure `?sslmode=require` is present.
4. Update Render `DATABASE_URL` → redeploy.

---

## Compare

| Provider | Free tier | Gotcha |
|----------|-----------|--------|
| **Supabase** | ~500 MB | Use pooler URL on Render; direct URL for migrations |
| **Render Postgres** | 1 GB, 30 days | Auto-linked in blueprint; expires unless upgraded |
| **Neon** | 0.5 GB | Suspend when idle; use pooled connection string |

---

## Local development

```bash
cd Backend && docker compose up -d   # or local Postgres on :5432
npm run prisma:push && npm run prisma:seed
```
