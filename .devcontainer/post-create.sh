#!/usr/bin/env bash
# Runs once when the dev container is created. Safe to re-run.
set -euo pipefail

# The node_modules volume is created root-owned
sudo chown node:node node_modules

copy_if_missing() {
  if [ ! -f "$2" ]; then cp "$1" "$2" && echo "created $2 from $1"; fi
}
copy_if_missing .env.example.dev .env
copy_if_missing config/fonoster.example.yaml config/fonoster.yaml
copy_if_missing config/autopilot.example.yaml config/autopilot.yaml

npm ci
npm run generate:keypair

# Headless Chromium + OS deps for Playwright (version pinned by package-lock)
npx playwright install --with-deps chromium
