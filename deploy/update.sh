#!/usr/bin/env bash
# 服务器上更新到最新代码并重启：bash deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only
sudo systemctl restart make-money-test
sleep 1
curl -fsS http://127.0.0.1:8788/healthz && echo " ← 服务正常"
