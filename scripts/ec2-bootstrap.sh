#!/usr/bin/env bash
# Bootstrap Amazon Linux 2023 EC2 for Rezervame API (free tier t3.micro).
# Run as ec2-user after SSH: bash ec2-bootstrap.sh

set -euo pipefail

echo "==> System packages"
sudo dnf update -y
sudo dnf install -y git nginx wget

echo "==> Node.js 20"
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs
node -v
npm -v

echo "==> PM2"
sudo npm install -g pm2

echo "==> Nginx reverse proxy (HTTP only — run certbot after DNS)"
sudo tee /etc/nginx/conf.d/rezervame-api.conf >/dev/null <<'NGINX'
server {
    listen 80 default_server;
    server_name _;

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
NGINX

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

cat <<'EOF'

✅ Bootstrap complete.

Next steps:
1. Clone repo:  git clone https://github.com/YOUR_ORG/Barber.git && cd Barber
2. Create Backend/.env (DATABASE_URL, JWT_SECRET, S3_*, AWS_*)
3. Build:         npm install && npm run build && cd Backend && npx prisma migrate deploy
4. Start API:     pm2 start "node dist/src/main.js" --name rezervame-api --cwd ~/Barber/Backend
5. pm2 save && pm2 startup
6. Health:        curl http://127.0.0.1:4000/api/v1/health
7. Point api.rezervame.com DNS to this Elastic IP; run: sudo certbot --nginx -d api.rezervame.com

See Backend/docs/AWS-EC2-S3-SETUP.md for full guide.

EOF
