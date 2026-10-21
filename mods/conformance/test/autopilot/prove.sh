#!/bin/sh
# Runs one Autopilot case wherever its tests live and writes their JUnit into a directory, for
# mods/conformance/catalog/prove.cjs:  prove.sh APT-012 /tmp/prove-x
# Run from the repository root; the full-stack case (APT-020) needs CONFORMANCE_NATS_URL. Exits 1
# when the run failed.
set -u
id="$1"
out="$2"
sh mods/conformance/test/autopilot/rebuild.sh || exit 1
LOGS_LEVEL=none npx mocha --timeout 60000 --exit --grep "\[$id\]" \
  --reporter xunit --reporter-option "output=$out/autopilot.xml" \
  mods/autopilot/test/session/conformance.test.ts \
  mods/autopilot/test/session/hosted.test.ts \
  mods/autopilot/test/session/tools.test.ts \
  mods/autopilot/test/session/telemetry.test.ts \
  mods/autopilot/test/session/usage.test.ts \
  mods/autopilot/test/session/fullstack.integration.test.ts \
  mods/autopilot/test/session/latency.integration.test.ts
