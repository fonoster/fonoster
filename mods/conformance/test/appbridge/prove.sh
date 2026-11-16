#!/bin/sh
# Runs one AppBridge case wherever its tests live and writes their JUnit into a directory, for
# mods/conformance/catalog/prove.cjs:  prove.sh APB-012 /tmp/prove-x
# Run from the repository root with CONFORMANCE_NATS_URL set. Exits 1 when the run failed.
set -u
id="$1"
out="$2"
# Most suites run AppBridge from source; a fault that fails type checking (APB-012) must still run
# them, so a failed rebuild leaves only the built-process suite (signals) on the previous build.
sh mods/conformance/test/appbridge/rebuild.sh || echo "rebuild of @fonoster/appbridge failed; dist/ is stale" >&2
# The T1 timing cases (APB-051 to APB-053) run for their proof and in the QA workflow's whole-area
# run (run.cjs, QA_RUN=1: nightly and the release gate), never on shared PR runners.
case "$id" in
  APB-051 | APB-052 | APB-053) timing=1 ;;
  *) timing="${QA_RUN:-}" ;;
esac
if [ "$timing" = 1 ] && [ -z "${CONFORMANCE_TIMING_RUNS:-}" ]; then
  CONFORMANCE_TIMING_RUNS=20
  export CONFORMANCE_TIMING_RUNS
fi
npx mocha --timeout 60000 --exit --grep "\[$id\]" \
  --reporter xunit --reporter-option "output=$out/appbridge.xml" \
  mods/appbridge/test/conformance.test.ts \
  mods/appbridge/test/integration.test.ts \
  mods/appbridge/test/formats.test.ts \
  mods/appbridge/test/amd.test.ts \
  mods/appbridge/test/appDestinations.test.ts \
  mods/appbridge/test/stream.test.ts \
  mods/appbridge/test/failedCallRecord.test.ts \
  mods/appbridge/test/admission.test.ts \
  mods/appbridge/test/workspaceDeleted.test.ts \
  mods/appbridge/test/calledNumber.test.ts \
  mods/appbridge/test/applicationsApi.test.ts \
  mods/appbridge/test/usageReport.test.ts \
  mods/appbridge/test/replayTool.test.ts \
  mods/appbridge/test/signals.test.ts \
  mods/appbridge/test/timing.test.ts \
  mods/appbridge/test/gonode.test.ts
