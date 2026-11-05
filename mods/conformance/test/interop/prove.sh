#!/bin/sh
# Runs one Interop case (catalog area IOP) and writes its JUnit into a directory, for
# mods/conformance/catalog/prove.cjs:  prove.sh IOP-004 /tmp/prove-x
# Run from the repository root after the build. A whole-area run (run.cjs) passes a pattern that
# matches every case.
set -u
id="$1"
out="$2"
npx mocha --timeout 30000 --exit --grep "\[$id\]" \
  --reporter xunit --reporter-option "output=$out/interop.xml" \
  mods/common/test/interop/classify.test.ts
