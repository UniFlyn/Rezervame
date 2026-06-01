# AWS setup: RDS + EC2 API + S3 images (free tier)

**Architecture**

| Component | Service | Stays on free tier? |
|-----------|---------|---------------------|
| Web | Firebase Hosting | ✅ (keep current) |
| Admin | Firebase Hosting | ✅ (keep current) |
| API | **EC2** `t3.micro` | ✅ ~12 months (750 hrs/mo) |
| Database | **RDS** PostgreSQL `db.t3.micro` | ✅ ~12 months |
| Images | **S3** bucket | ✅ ~5 GB / 12 months |

Set **billing alarms** in AWS ($10, $20) — free tier expires and wrong settings can charge you.

---

## Part 1 — RDS (database) — connect EC2

You already created RDS. Finish networking:

### 1.1 Security group for RDS (`rezervame-rds-sg`)

- **Inbound:** PostgreSQL **5432**
  - Source: security group of EC2 (best), **or** temporarily your IP for testing
- **No** `0.0.0.0/0` in production unless you accept public DB risk

### 1.2 Note connection string

RDS → **Connectivity** → copy endpoint.

```
postgresql://rezervame:PASSWORD@rezervame-db.xxxxx.us-east-1.rds.amazonaws.com:5432/rezervame?sslmode=require
```

Use this as `DATABASE_URL` on EC2 (not on Firebase).

---

## Part 2 — S3 bucket (images, free tier)

### 2.1 Create bucket

1. **S3** → **Create bucket**
2. Name: `rezervame-assets-<random>` (globally unique)
3. Region: **same as EC2 and RDS** (e.g. `us-east-1`)
4. **Block Public Access:** turn **off** only if you want public image URLs (simplest for Web/Mobile)
5. Bucket versioning: **Off** (saves cost)
6. Default encryption: **SSE-S3** (free)

### 2.2 Bucket policy (public read for `uploads/` only)

S3 → bucket → **Permissions** → **Bucket policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadUploads",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/uploads/*"
    }
  ]
}
```

Replace `YOUR_BUCKET_NAME`.

### 2.3 CORS (optional — only if browser uploads direct to S3 later)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": [
      "https://rezervame-web.web.app",
      "https://rezervame-admin.web.app",
      "http://localhost:3000",
      "http://localhost:3001"
    ],
    "ExposeHeaders": []
  }
]
```

### 2.4 IAM user for EC2 (S3 only — not root account)

1. **IAM** → **Users** → **Create user** `rezervame-ec2-s3`
2. Attach policy **AmazonS3FullAccess** (or custom policy scoped to one bucket)
3. **Security credentials** → **Access key** → save `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`

### 2.5 Stay in free tier

- Stay under **5 GB** storage
- Avoid many small PUTs beyond free request limits
- **Do not** enable S3 Transfer Acceleration (paid)
- Compress images before upload (backend resizes large uploads)

**Public URL format:**

`https://YOUR_BUCKET.s3.REGION.amazonaws.com/uploads/venues/xxx.jpg`

---

## Part 3 — EC2 for NestJS API (free tier)

### 3.1 Launch instance

1. **EC2** → **Launch instance**
2. Name: `rezervame-api`
3. AMI: **Amazon Linux 2023**
4. Instance type: **t3.micro** (or **t2.micro**) — must show **Free tier eligible**
5. Key pair: create/download `.pem`
6. Network: same **VPC** as RDS
7. Security group `rezervame-api-sg`:
   - **22** SSH — your IP only
   - **80** HTTP — `0.0.0.0/0` (for nginx + Let’s Encrypt)
   - **443** HTTPS — `0.0.0.0/0`
   - **4000** — optional direct API test; remove after nginx
8. Storage: **30 GB gp3** (free tier often includes 30 GB EBS)

### 3.2 Elastic IP (recommended)

**EC2** → **Elastic IPs** → Allocate → Associate with `rezervame-api`.

Use this IP for DNS / Firebase API URL (stable).

### 3.3 SSH and bootstrap

```bash
chmod 400 ~/Downloads/rezervame-api.pem
ssh -i ~/Downloads/rezervame-api.pem ec2-user@YOUR_ELASTIC_IP
```

On the server, run the bootstrap script from the repo (or follow manual steps below):

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/Barber/main/scripts/ec2-bootstrap.sh | bash
```

Or copy `scripts/ec2-bootstrap.sh` from this repo and run it on EC2.

### 3.4 Manual install (if not using script)

```bash
sudo dnf update -y
sudo dnf install -y git nginx

# Node 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

sudo npm install -g pm2

# Clone (use deploy key or copy files)
git clone https://github.com/YOUR_ORG/Barber.git
cd Barber/Backend
npm install
npx prisma generate
```

### 3.5 Environment file on EC2

`/home/ec2-user/Barber/Backend/.env`:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://USER:PASS@your-rds-endpoint:5432/rezervame?sslmode=require

JWT_SECRET=...
SESSION_SECRET=...

WEB_APP_URL=https://rezervame-web.web.app
ADMIN_APP_URL=https://rezervame-admin.web.app

# S3
AWS_REGION=us-east-1
S3_BUCKET_NAME=rezervame-assets-xxxxx
S3_PUBLIC_BASE_URL=https://rezervame-assets-xxxxx.s3.us-east-1.amazonaws.com
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_UPLOAD_PREFIX=uploads

# Postmark (when ready)
POSTMARK_API_KEY=...
POSTMARK_FROM_EMAIL=noreply@rezervame.com
POSTMARK_REPLY_TO=soporte@rezervame.com
```

### 3.6 Build and run

From repo root on EC2:

```bash
cd /home/ec2-user/Barber
npm install
npm run build
cd Backend && npx prisma migrate deploy

pm2 start "node dist/src/main.js" --name rezervame-api --cwd /home/ec2-user/Barber/Backend
pm2 save
pm2 startup
```

Health check: `http://YOUR_ELASTIC_IP:4000/api/v1/health` → `"postgres": "ok"`.

### 3.7 Nginx + HTTPS (recommended)

```bash
sudo tee /etc/nginx/conf.d/rezervame.conf <<'EOF'
server {
    listen 80;
    server_name api.rezervame.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 25M;
    }
}
EOF
sudo nginx -t && sudo systemctl enable nginx && sudo systemctl restart nginx
```

DNS: `api.rezervame.com` → Elastic IP (Route 53 or your registrar).

HTTPS:

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.rezervame.com
```

API base URL: `https://api.rezervame.com/api`

---

## Part 4 — Firebase Web + Admin (keep hosting)

Rebuild with new API URL:

```bash
# On your Mac, from repo root
export NEXT_PUBLIC_API_BASE_URL=https://api.rezervame.com/api
npm run deploy:web
npm run deploy:admin
```

Or set in `Web/.env.production` and `Admin/.env.production` before deploy.

Mobile APK:

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.rezervame.com/api \
  --dart-define=WEB_BASE_URL=https://rezervame-web.web.app
```

---

## Part 5 — Migrate data to RDS

From your Mac:

```bash
./scripts/migrate-database.sh \
  "postgresql://premkumar@localhost:5432/rezervame" \
  "postgresql://USER:PASS@RDS_ENDPOINT:5432/rezervame?sslmode=require"
```

---

## Part 6 — S3 uploads in the API

When S3 env vars are set, the API:

- Exposes `POST /api/storage/upload` (base64 / data-URL image → S3 → HTTPS URL)
- Auto-uploads `data:image/...` on business logo/banner save to S3

Test upload:

```bash
curl -X POST https://api.rezervame.com/api/storage/upload \
  -H "Content-Type: application/json" \
  -d '{"folder":"test","dataUrl":"data:image/png;base64,..."}'
```

---

## Part 7 — Billing alarms (required)

1. **Billing** → **Budgets** → Create budget → $10 / month alert
2. **CloudWatch** → Billing metrics (enable in account preferences)
3. Tag resources: `Project=rezervame`

---

## Free tier checklist

| Service | Limit | Action before expiry |
|---------|-------|----------------------|
| EC2 t3.micro | 750 h/mo × 12 mo | Upgrade or stop instance |
| RDS db.t3.micro | 750 h/mo × 12 mo | Snapshot + upgrade |
| S3 | 5 GB × 12 mo | Lifecycle delete old images |
| EBS | 30 GB | Don’t add extra volumes |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `postgres: error` on health | RDS SG must allow EC2 SG on 5432; check `DATABASE_URL` |
| Web can’t call API | CORS is enabled on API; use HTTPS API URL in Firebase build |
| Images 403 | Bucket policy on `uploads/*`; check `S3_PUBLIC_BASE_URL` |
| EC2 out of memory | t3.micro has 1 GB — avoid building on server; build on Mac, rsync `dist/` |
