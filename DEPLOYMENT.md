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

### Frontend (Firebase)
- **Web Build**: Next.js Static Export (`out/`)
- **Admin Build**: Next.js Static Export (`out/`)
- **API Connection**: Linked via `NEXT_PUBLIC_API_BASE_URL` pointing to Render.

## 📂 Backup & Maintenance
- **Backup Script**: [scripts/backup.sh](file:///Users/premkumar/Desktop/Barber/scripts/backup.sh)
- **Local Dev**: Use `npm run dev:all` to start the local stack.
