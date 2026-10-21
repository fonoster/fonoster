#!/bin/sh
# Runs one Dashboard case (catalog area DSH) and writes its JUnit into a directory, for
# mods/conformance/catalog/prove.cjs:  prove.sh DSH-017 /tmp/prove-x
# Run from the repository root. Mocked cases build the SPA from source (the webServer of
# playwright.config.ts). Real-stack cases need ops/rebuild/stack up and seeded (DSH-039: with the
# billing profile); the SPA is built from source and served by vite.prove.config.ts in front of the stack's
# API, so the fault is what the tests meet. Exits 1 when the run failed.
set -u
id="$1"
out="$2"
cd mods/dashboard
export CI=1 PLAYWRIGHT_JUNIT_OUTPUT_NAME="$out/dashboard.xml"
if grep -q "\[$id\]" e2e/*.real.spec.ts e2e-stack/*.spec.ts 2>/dev/null; then
  port="${PROVE_SPA_PORT:-16480}"
  npx vite build --config vite.prove.config.ts --outDir "$out/spa" --logLevel warn || exit 1
  npx vite preview --config vite.prove.config.ts --outDir "$out/spa" --port "$port" --strictPort \
    >"$out/vite.log" 2>&1 &
  vite=$!
  trap 'kill $vite 2>/dev/null' EXIT
  for _ in $(seq 1 60); do curl -sf "http://localhost:$port/config.js" >/dev/null && break; sleep 1; done
  if grep -q "\[$id\]" e2e-stack/*.spec.ts; then
    . ../../ops/rebuild/.local/stack.env
    RB_DASHBOARD_URL="http://localhost:$port" RB_ADMIN_EMAIL="$RB_ADMIN_EMAIL" \
      RB_ADMIN_PASSWORD="$RB_ADMIN_PASSWORD" \
      RB_STRIPE_FAKE_URL="http://localhost:${RB_STRIPE_FAKE_PORT:-12111}" \
      npx playwright test -c playwright.stack.config.ts --grep "\[$id\]" --reporter=junit
  else
    E2E_REAL_URL="http://localhost:$port" node e2e/real-env.cjs --grep "\[$id\]" --reporter=junit
  fi
  exit $?
fi
npx playwright test --grep "\[$id\]" --reporter=junit
