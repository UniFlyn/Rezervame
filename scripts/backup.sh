#!/bin/bash

# Backup script for Rezervame Stack
# Backs up database, environment variables, and code configuration locally.

BACKUP_ROOT="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

echo "📂 Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR/db"
mkdir -p "$BACKUP_DIR/env"

# 1. Database Backup
# Load DATABASE_URL from Backend/.env if available
if [ -f "Backend/.env" ]; then
    export $(grep -v '^#' Backend/.env | xargs)
fi

if [ -n "$DATABASE_URL" ]; then
    echo "🗄️ Backing up remote database..."
    # Strip Prisma-specific query parameters (like ?schema=public) for pg_dump
    DB_URL_CLEAN=$(echo $DATABASE_URL | sed 's/\?.*//')
    pg_dump "$DB_URL_CLEAN" > "$BACKUP_DIR/db/database_backup.sql"
    if [ $? -eq 0 ]; then
        echo "✅ Database backup successful."
    else
        echo "❌ Database backup failed."
    fi
else
    echo "⚠️ DATABASE_URL not found. Skipping database backup."
fi

# 2. Environment Variables Backup
echo "📝 Backing up environment files..."
[ -f "Backend/.env" ] && cp "Backend/.env" "$BACKUP_DIR/env/backend.env"
[ -f "Web/.env.local" ] && cp "Web/.env.local" "$BACKUP_DIR/env/web.env"
[ -f "Admin/.env.local" ] && cp "Admin/.env.local" "$BACKUP_DIR/env/admin.env"
[ -f ".firebaserc" ] && cp ".firebaserc" "$BACKUP_DIR/env/firebase.firebaserc"

# 3. Create a symlink to 'latest'
rm -f "$BACKUP_ROOT/latest"
ln -s "$TIMESTAMP" "$BACKUP_ROOT/latest"

echo "✅ Backup complete! Saved to $BACKUP_DIR"
echo "💡 You can find the latest backup at $BACKUP_ROOT/latest"
