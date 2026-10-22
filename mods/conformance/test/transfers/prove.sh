#!/bin/sh
# Runs one Transfers and DTMF case (catalog area XFR) and writes its JUnit into a directory, for
# mods/conformance/catalog/prove.cjs:  prove.sh XFR-004 /tmp/prove-x
# Run from the repository root with CONFORMANCE_NATS_URL set (JetStream on); the Python SDK cases
# run $PYTHON (default python3) with fonoster-voice installed. Exits 1 when a run failed.
set -u
id="$1"
out="$2"
status=0
sh mods/conformance/test/transfers/rebuild.sh || exit 1
LOGS_LEVEL=none npx mocha --timeout 60000 --exit --grep "\[$id\]" \
  --reporter xunit --reporter-option "output=$out/xfr.xml" \
  mods/appbridge/test/transfers.integration.test.ts || status=1
LOGS_LEVEL=none npx mocha --timeout 60000 --exit --grep "\[$id\]" \
  --reporter xunit --reporter-option "output=$out/xfr-autopilot.xml" \
  mods/autopilot/test/session/transfers.integration.test.ts || status=1
exit $status
