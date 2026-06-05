#!/usr/bin/env bash
# Wanzami API health watchdog — checks the public endpoint; restarts backend on failure.
set -uo pipefail
URL="${HEALTH_URL:-https://api.blvckcode.io/api/health}"
DIR="/root/wanzami"
LOG="$DIR/ops/watchdog.log"
[ -f "$DIR/ops/alert.env" ] && . "$DIR/ops/alert.env"

ok=0
for _ in 1 2 3; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$URL" || echo 000)
  [ "$code" = "200" ] && { ok=1; break; }
  sleep 5
done

ts=$(date -u +%FT%TZ)
if [ "$ok" = "1" ]; then
  echo "$ts OK $code" >> "$LOG"
else
  echo "$ts UNHEALTHY ($code) — restarting backend" >> "$LOG"
  cd "$DIR" && docker compose -f deploy/docker-compose.yml --env-file deploy/.env restart backend >> "$LOG" 2>&1
  if [ -n "${TG_BOT_TOKEN:-}" ] && [ -n "${TG_CHAT_ID:-}" ]; then
    curl -s "https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage" \
      --data-urlencode chat_id="${TG_CHAT_ID}" \
      --data-urlencode text="⚠️ Wanzami API unhealthy (HTTP $code) on 167.233.26.153 — restarted backend at $ts" >/dev/null || true
  fi
fi

# keep the log bounded
tail -n 500 "$LOG" > "$LOG.tmp" 2>/dev/null && mv "$LOG.tmp" "$LOG"
