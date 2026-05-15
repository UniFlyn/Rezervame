# Rezervame Deployment Summary

The Rezervame platform is now deployed across a distributed cloud architecture for maximum reliability and cost-efficiency.

## 🚀 Hosting Architecture

| Component | Service Provider | Status | URL |
| :--- | :--- | :--- | :--- |
| **Web Portal** | Firebase Hosting | ✅ Live | [https://rezervame-web.web.app](https://rezervame-web.web.app) |
| **Admin Portal** | Firebase Hosting | ✅ Live | [https://rezervame-admin.web.app](https://rezervame-admin.web.app) |
| **Backend API** | Render.com | ✅ Live | [https://rezervame-backend.onrender.com](https://rezervame-backend.onrender.com) |
| **Database** | Neon.tech (PostgreSQL) | ✅ Live | *Managed via connection string* |

## 🛠️ Configuration Details

### Backend (Render)
- **Runtime**: Node.js
- **Build**: `cd Backend && npm install --production=false && npm run build && npx prisma generate`
- **Start**: `cd Backend && node dist/src/main`
- **Port**: 4000 (Dynamic)

### Frontend (Firebase)
- **Web Build**: Next.js Static Export (`out/`)
- **Admin Build**: Next.js Static Export (`out/`)
- **API Connection**: Linked via `NEXT_PUBLIC_API_BASE_URL` pointing to Render.

## 📂 Backup & Maintenance
- **Backup Script**: [scripts/backup.sh](file:///Users/premkumar/Desktop/Barber/scripts/backup.sh)
- **Local Dev**: Use `npm run dev:all` to start the local stack.
