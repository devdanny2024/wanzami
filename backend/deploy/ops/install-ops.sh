#!/usr/bin/env bash
# Installs the Wanzami host-level systemd timers (health watchdog + nightly backup).
set -euo pipefail
cd "$(dirname "$0")"
chmod +x healthcheck.sh backup.sh
cp wanzami-watchdog.service wanzami-watchdog.timer \
   wanzami-backup.service   wanzami-backup.timer  /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now wanzami-watchdog.timer wanzami-backup.timer
echo "Installed. Active timers:"
systemctl list-timers 'wanzami-*' --no-pager | head
