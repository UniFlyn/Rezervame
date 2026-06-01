# Rezervame Deployment Summary

The Rezervame platform is now deployed across a distributed cloud architecture for maximum reliability and cost-efficiency.

## 🚀 Hosting Architecture

| Component | Service Provider | Status | URL |
| :--- | :--- | :--- | :--- |
| **Web Portal** | Firebase Hosting | ✅ Live | [https://rezervame-web.web.app](https://rezervame-web.web.app) |
| **Admin Portal** | Firebase Hosting | ✅ Live | [https://rezervame-admin.web.app](https://rezervame-admin.web.app) |
| **Backend API** | Render.com | ✅ Live | [https://rezervame.onrender.com](https://rezervame.onrender.com) |
| **Database** | Neon.tech (PostgreSQL) | ✅ Live | *Managed via connection string* |

## 🛠️ Configuration Details

### Backend (Render)

In the Render dashboard (or `render.yaml`), use **npm/yarn from repo root** — root `package.json` installs Backend deps before `nest build`:

| Setting | Value |
| --- | --- |
| **Root directory** | *(repo root, leave empty)* |
| **Build command** | `npm install && npm run build` — or `yarn install && yarn build` |
| **Start command** | `npm start` — or `yarn start` |
| **Node** | 20.x (see `.node-version`) |
| **Port** | `4000` |

Do **not** use `npm run build --prefix Backend` alone — that skips `Backend/node_modules` and fails with `could not determine executable to run` for `nest`.

Required env: `DATABASE_URL`, `JWT_SECRET`, `SESSION_SECRET`, `NODE_ENV=production`.

**Email (Postmark):** `POSTMARK_API_KEY`, `POSTMARK_FROM_EMAIL=noreply@rezervame.com`, `POSTMARK_REPLY_TO=soporte@rezervame.com`, `POSTMARK_MESSAGE_STREAM=outbound`. When set, all `sendEmail()` calls use Postmark instead of Admin SMTP. See `Backend/docs/POSTMARK-INTEGRATION-GUIDE.md`.

**Booking reminders:** set `CRON_SECRET`, then schedule `POST https://rezervame.onrender.com/api/cron/booking-reminders` with header `Authorization: Bearer <CRON_SECRET>` (hourly). Requires Postmark templates `booking-reminder-24h` and `booking-reminder-1h`.

**Postmark webhooks:** `POST https://rezervame.onrender.com/webhooks/postmark` — optional header `X-Webhook-Token: <POSTMARK_WEBHOOK_TOKEN>`.

**Neon `DATABASE_URL` (recommended on Render):** use the **pooled** connection string from the Neon dashboard and ensure it includes SSL, e.g. ends with `?sslmode=require`. After rotating the Neon password, update Render env and redeploy.

Check production from your machine:

```bash
node scripts/check-production-api.mjs
```

Healthy response: `"postgres": "ok"`. If `"postgres": "error"`, the Web/Mobile apps will show “Failed to fetch” / empty data even though Render shows the service as “live”.

### Backend keeps “disconnecting” — usual causes

| Symptom | Cause | Fix |
| --- | --- | --- |
| First request slow (30–60s), then works | **Render free tier** spins down after ~15 min idle | Upgrade plan or wait for cold start; not a code bug |
| Every request fails / 500 / empty app | **PostgreSQL not connected** (`postgres: error` in health) | Fix `DATABASE_URL` on Render; resume Neon project; redeploy |
| Works then stops | Neon **suspended** (free) or wrong password | Neon console → resume DB → copy new connection string → Render env |
| Build OK, API 500 on data routes | Migrations not applied | Render build must run `npx prisma migrate deploy` (root `npm run build` does this) |

### Frontend (Firebase)
- **Web Build**: Next.js Static Export (`out/`)
- **Admin Build**: Next.js Static Export (`out/`)
- **API Connection**: Linked via `NEXT_PUBLIC_API_BASE_URL` pointing to Render.

## 📂 Backup & Maintenance
- **Backup Script**: [scripts/backup.sh](file:///Users/premkumar/Desktop/Barber/scripts/backup.sh)
- **Local Dev**: Use `npm run dev:all` to start the local stack.
