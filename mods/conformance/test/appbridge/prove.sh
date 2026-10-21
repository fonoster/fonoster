#!/bin/sh
# Runs one AppBridge case wherever its tests live and writes their JUnit into a directory, for
# mods/conformance/catalog/prove.cjs:  prove.sh APB-012 /tmp/prove-x
# Run from the repository root with CONFORMANCE_NATS_URL set. Exits 1 when the run failed.
set -u
id="$1"
out="$2"
npx mocha --timeout 60000 --exit --grep "\[$id\]" \
  --reporter xunit --reporter-option "output=$out/appbridge.xml" \
  mods/appbridge/test/conformance.test.ts \
  mods/appbridge/test/integration.test.ts \
  mods/appbridge/test/formats.test.ts \
  mods/appbridge/test/amd.test.ts \
  mods/appbridge/test/appDestinations.test.ts
