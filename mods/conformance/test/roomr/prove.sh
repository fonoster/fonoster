#!/bin/sh
# Runs one Roomr case wherever its tests live and writes their JUnit into a directory, for
# mods/conformance/catalog/prove.cjs:  prove.sh ROM-012 /tmp/prove-x
# run.cjs passes a pattern instead (ROM-\d{3}): every case, both kinds.
#
# Go e2e tests carry the id in their name (go/roomr/e2e, TestROM012_Name) and run with gotestsum;
# the TypeScript suites carry it in their titles ([ROM-012]), or take it from the scenario files
# the case Runs (areas/roomr.md), and run with mocha. A single id runs only the kinds that carry it.
#
# Run from the repository root, as CI does (pr-checks.yaml "go", conformance.yaml):
#   CONFORMANCE_NATS_URL   a NATS server with JetStream (nats-server -js)
#   ROUTR_EDGEPORT, ROUTR_NODE_HOST   the Routr in go/roomr/e2e/testdata/routr (ROM-034)
# Exits 1 when any run failed.
set -u
id="$1"
out="$2"
root=$(pwd)
status=0
case "$out" in /*) ;; *) out="$root/$out" ;; esac
mkdir -p "$out"

TS_FILES="mods/conformance/test/media-control-go.test.ts
mods/conformance/test/media-control.test.ts
mods/conformance/test/roomr-grpc.test.ts
mods/appbridge/test/gonode.test.ts
mods/appbridge/test/srtp.test.ts"

compact=$(printf %s "$id" | sed 's/-//')
run_go=1
run_ts=1
case "$id" in
  [A-Z]*-[0-9][0-9][0-9])
    grep -q "^func Test${compact}_" go/roomr/e2e/*_test.go || run_go=0
    # shellcheck disable=SC2086
    if ! grep -q "\[$id\]" $TS_FILES; then
      awk -v id="$id" '/^### /{on=($2==id)} on && /^- \*\*Runs:\*\*/{found=1} END{exit !found}' \
        mods/conformance/catalog/areas/roomr.md || run_ts=0
    fi
    ;;
esac

if [ "$run_go" = 1 ]; then
  # Packages one at a time, as in CI: several tests bind local ports.
  (cd go/roomr && GOTOOLCHAIN="${GOTOOLCHAIN:-local}" go run gotest.tools/gotestsum@v1.12.0 \
    --junitfile "$out/roomr-go.xml" -- -p 1 -count=1 -run "^Test${compact}_" ./e2e/) || status=1
fi

if [ "$run_ts" = 1 ]; then
  # shellcheck disable=SC2086
  npx mocha --exit --timeout 120000 --grep "\[$id\]" \
    --reporter xunit --reporter-option "output=$out/roomr-ts.xml" $TS_FILES || status=1
fi

exit $status
