#!/usr/bin/env bash
# Wanzami VPS deploy — invoked over SSH by .github/workflows/deploy-vps.yml.
#
# The workflow has already rsync'd the latest backend/ source into $WANZAMI_DIR
# (deploy/.env, ops/, backups/ are preserved). This script builds the app image
# on the box and rolls the app containers; postgres/redis/caddy keep running
# (same compose project + named volumes), so there is no data blip.
set -euo pipefail

DIR="${WANZAMI_DIR:-/root/wanzami}"
cd "$DIR"
compose() { docker compose -f deploy/docker-compose.yml --env-file deploy/.env "$@"; }

echo "==> Building image and applying stack"
compose up -d --build --remove-orphans

echo "==> Waiting for backend container to report healthy"
for i in $(seq 1 40); do
  status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' wanzami-backend-1 2>/dev/null || echo missing)"
  case "$status" in
    healthy) echo "backend healthy"; break ;;
    unhealthy) echo "backend reported unhealthy"; compose logs --tail 80 backend; exit 1 ;;
  esac
  if [ "$i" -eq 40 ]; then
    echo "backend did not become healthy in time (last status: $status)"
    compose logs --tail 80 backend
    exit 1
  fi
  sleep 5
done

echo "==> External health check"
URL="${HEALTH_URL:-https://api.blvckcode.io/api/health}"
code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$URL" || echo 000)"
echo "$URL -> $code"
[ "$code" = "200" ] || { echo "external health check failed"; exit 1; }

echo "==> Pruning dangling images"
docker image prune -f >/dev/null || true

echo "${GIT_SHA:-unknown}" > "$DIR/.DEPLOYED_SHA"
echo "==> Deployed ${GIT_SHA:-unknown}"
