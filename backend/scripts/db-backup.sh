#!/bin/sh
# One-command backup of the Railway Postgres database.
# Usage: ./scripts/db-backup.sh   (from backend/)
# Writes a pg_restore-able dump to ~/db-backups/.
set -eu
cd "$(dirname "$0")/.."
DBURL=$(grep '^DATABASE_URL=' .env | cut -d= -f2-)
mkdir -p "$HOME/db-backups"
OUT="$HOME/db-backups/cardinal_$(date +%Y%m%d_%H%M).dump"
pg_dump "$DBURL" -Fc -f "$OUT"
echo "Backup written: $OUT"
