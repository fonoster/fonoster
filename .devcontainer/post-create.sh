#!/usr/bin/env bash
# Runs once when the dev container is created (postCreateCommand). Safe to re-run.
set -euo pipefail

# Named volumes are created root-owned.
sudo chown node:node node_modules /home/node/go
# The checkout is owned by your host user, not `node`: let git (and husky) use it.
git config --global --add safe.directory /workspaces/fonoster

# Dependencies (postinstall generates the Prisma clients into this container's node_modules),
# then every package's build: the services import each other's dist.
npm ci --no-audit --no-fund
npm run build
(cd go/roomr && go mod download)

# The dev config (.dev/), rendered again with the CLI just built; every secret is kept.
npm run dev:config

cat <<'MSG'

Fonoster dev container ready. Start everything with:

  npm run dev

The dashboard's browser tests need Chromium once: npm run dev:e2e-setup

MSG
npm run --silent dev:info
