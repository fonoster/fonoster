#!/bin/sh
# Runs one API case wherever its tests live and writes their JUnit into a directory, for
# mods/conformance/catalog/prove.cjs:  prove.sh API-012 /tmp/prove-x
# Run from the repository root. Exits 1 when any run failed.
set -u
id="$1"
out="$2"
status=0
sh mods/conformance/test/api/rebuild.sh || exit 1
npx mocha --config mods/conformance/test/api/.mocharc.cjs --grep "\[$id\]" \
  --reporter xunit --reporter-option "output=$out/api.xml" || status=1
# The identity tests need no bus: no conformance NATS lock. --exit, because a fault may leave a
# timer running in the test process itself.
CONFORMANCE_NATS_URL= npx mocha --exit --grep "\[$id\]" \
  --reporter xunit --reporter-option "output=$out/identity.xml" \
  mods/identity/test/server/standaloneService.test.ts \
  mods/identity/test/server/sharedLimits.test.ts \
  mods/identity/test/server/serverFree.test.ts \
  'mods/identity-client/test/*.test.ts' || status=1
exit $status
