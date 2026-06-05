#!/usr/bin/env bash
# Wanzami nightly DB backup — pg_dump the VPS Postgres, keep 7 local, push to R2.
set -euo pipefail
DIR="/root/wanzami"
BK="$DIR/backups"
LOG="$DIR/ops/backup.log"
mkdir -p "$BK"
TS=$(date -u +%Y%m%d_%H%M%S)
FILE="$BK/wanzami_${TS}.dump"

docker exec wanzami-postgres-1 pg_dump -U wanzami -d wanzami -Fc > "$FILE"

# keep only the 7 most recent local dumps
ls -1t "$BK"/wanzami_*.dump 2>/dev/null | tail -n +8 | xargs -r rm -f

# push to R2 (rclone config at /root/.config/rclone/rclone.conf)
if rclone copy "$FILE" r2:wanzami-media/db-backups/ >> "$LOG" 2>&1; then
  echo "$(date -u +%FT%TZ) backed up $(basename "$FILE") $(du -h "$FILE" | cut -f1) -> R2" >> "$LOG"
else
  echo "$(date -u +%FT%TZ) WARN local dump ok but R2 push failed: $(basename "$FILE")" >> "$LOG"
fi
