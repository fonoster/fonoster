#!/bin/sh
# Runs one Billing case wherever its tests live and writes their JUnit into a directory, for
# mods/conformance/catalog/prove.cjs:  prove.sh BIL-012 /tmp/prove-x
# Run from the repository root with PERSISTENCE_TEST_DATABASE_URL and CONFORMANCE_NATS_URL set.
# Whole files run, not the case alone: the Stripe suites build on the accounts and the test clock
# earlier tests left. Exits 1 when any run failed.
set -u
id="$1"
out="$2"
status=0
area=mods/conformance/catalog/areas/billing.md
# The area's mocha files that carry the id, and the scenario suite when the case Runs a file.
files=$(node -e 'require("./mods/conformance/test/billing/.mocharc.cjs").spec.forEach((f) => console.log(f))' |
  while read -r f; do grep -q "\[$id\]" "$f" && echo "$f"; done)
if awk -v id="$id" '/^### /{cur=$2} /^- \*\*Runs:\*\*/{if (cur == id) found=1} END{exit !found}' "$area"; then
  files="$files $(pwd)/mods/conformance/test/billingScenarios.test.ts"
fi
if [ -n "$(echo $files)" ]; then
  # The timing case (BIL-036) runs only when asked, as the other timing tests do.
  BIL_SPEC="$files" CONFORMANCE_TIMING_RUNS=1 npx mocha --config mods/conformance/test/billing/.mocharc.cjs \
    --reporter xunit --reporter-option "output=$out/bil.xml" || status=1
fi
# The viewer: built with the fault in it (rebuild.sh builds it again once the fault is reverted).
if grep -q "\[$id\]" mods/stripe-fake/viewer/e2e/viewer.spec.ts; then
  sh mods/conformance/test/billing/rebuild.sh viewer || exit 1
  (cd mods/stripe-fake && PLAYWRIGHT_JUNIT_OUTPUT_NAME="$out/viewer.xml" \
    npx playwright test --config viewer/playwright.config.ts --reporter=junit) || status=1
fi
exit $status
