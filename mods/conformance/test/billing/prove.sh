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
# The id may be a pattern (run.cjs passes BIL-\d{3} to run the whole area): match it as an ERE.
pat=$(printf '%s' "$id" | sed 's/\\d/[0-9]/g')
area=mods/conformance/catalog/areas/billing.md
# The area's mocha files that carry the id, and the scenario suite when the case Runs a file.
files=$(node -e 'require("./mods/conformance/test/billing/.mocharc.cjs").spec.forEach((f) => console.log(f))' |
  while read -r f; do grep -qE "\[$pat\]" "$f" && echo "$f"; done)
if awk -v pat="^$pat\$" '/^### /{cur=$2} /^- \*\*Runs:\*\*/{if (cur ~ pat) found=1} END{exit !found}' "$area"; then
  files="$files $(pwd)/mods/conformance/test/billingScenarios.test.ts"
fi
if [ -n "$(echo $files)" ]; then
  # The timing case (BIL-036) runs only for its proof, as the other timing tests run only when asked.
  timing=""; [ "$id" = BIL-036 ] && timing=1
  BIL_SPEC="$files" CONFORMANCE_TIMING_RUNS="$timing" npx mocha --config mods/conformance/test/billing/.mocharc.cjs \
    --reporter xunit --reporter-option "output=$out/bil.xml" || status=1
fi
# The viewer: built with the fault in it (rebuild.sh builds it again once the fault is reverted).
if grep -qE "\[$pat\]" mods/stripe-fake/viewer/e2e/viewer.spec.ts; then
  sh mods/conformance/test/billing/rebuild.sh viewer || exit 1
  (cd mods/stripe-fake && PLAYWRIGHT_JUNIT_OUTPUT_NAME="$out/viewer.xml" \
    npx playwright test --config viewer/playwright.config.ts --reporter=junit) || status=1
fi
exit $status
