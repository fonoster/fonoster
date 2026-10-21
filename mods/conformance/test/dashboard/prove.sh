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
# The whole area (run.cjs, QA_RUN=1): the mocked projects, then the real project when the stack is
# up and seeded, then the Billing page when its profile is on (QA_BILLING=1), each against the
# stack's own dashboard.
if [ "${QA_RUN:-}" = 1 ]; then
  status=0
  npx playwright test --grep "\[$id\]" --reporter=junit || status=1
  if [ -f ../../ops/rebuild/.local/seed.json ]; then
    PLAYWRIGHT_JUNIT_OUTPUT_NAME="$out/real.xml" \
      node e2e/real-env.cjs --grep "\[$id\]" --reporter=junit || status=1
  fi
  if [ "${QA_BILLING:-}" = 1 ]; then
    # The calls above used Trial credits: the Billing page case starts from a fresh account.
    ../../ops/rebuild/stack billing-reset >/dev/null || status=1
    . ../../ops/rebuild/.local/stack.env
    PLAYWRIGHT_JUNIT_OUTPUT_NAME="$out/billing.xml" \
      RB_DASHBOARD_URL="http://localhost:$RB_API_PORT" RB_ADMIN_EMAIL="$RB_ADMIN_EMAIL" \
      RB_ADMIN_PASSWORD="$RB_ADMIN_PASSWORD" \
      RB_STRIPE_FAKE_URL="http://localhost:${RB_STRIPE_FAKE_PORT:-12111}" \
      npx playwright test -c playwright.stack.config.ts --grep "\[$id\]" --reporter=junit || status=1
  fi
  exit $status
fi
if grep -q "\[$id\]" e2e/*.real.spec.ts e2e-stack/*.spec.ts 2>/dev/null; then
  # A port of this run's own, checked free: a server left by an earlier case would serve that
  # case's build, and the tests would meet the wrong fault.
  port="${PROVE_SPA_PORT:-$((16480 + $$ % 400))}"
  if curl -s -o /dev/null "http://localhost:$port/"; then
    echo "port $port is already serving; stop it first" >&2
    exit 1
  fi
  vite=../../node_modules/.bin/vite
  "$vite" build --config vite.prove.config.ts --outDir "$out/spa" --logLevel warn || exit 1
  # The vite binary itself, not npx, so the trap stops the server and not only a wrapper.
  "$vite" preview --config vite.prove.config.ts --outDir "$out/spa" --port "$port" --strictPort \
    >"$out/vite.log" 2>&1 &
  server=$!
  trap 'kill $server 2>/dev/null; wait $server 2>/dev/null' EXIT
  ready=""
  for _ in $(seq 1 60); do
    curl -sf "http://localhost:$port/config.js" >/dev/null && { ready=1; break; }
    sleep 1
  done
  [ -n "$ready" ] || { cat "$out/vite.log" >&2; exit 1; }
  if grep -q "\[$id\]" e2e-stack/*.spec.ts; then
    ../../ops/rebuild/stack billing-reset >/dev/null || exit 1
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
