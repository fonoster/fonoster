#!/bin/sh
# Runs one Voice SDK case (catalog area VSD) wherever its tests live and writes their JUnit into a
# directory, for mods/conformance/catalog/prove.cjs:  prove.sh VSD-004 /tmp/prove-x
# Run from the repository root. The Twilio cases need CONFORMANCE_NATS_URL; the Python SDK runs with
# $PYTHON (default python3) when fonoster-voice is installed there; VSD-016 (Pipecat) needs
# PIPECAT_PYTHON. Exits 1 when a run failed.
set -u
id="$1"
out="$2"
status=0
npx mocha --timeout 60000 --exit --grep "\[$id\]" \
  --reporter xunit --reporter-option "output=$out/voice.xml" \
  mods/voice/test/conformance.test.ts \
  mods/voice/test/VoiceServer.test.ts \
  mods/voice/test/appBinding.test.ts \
  mods/appbridge/test/conformance.test.ts \
  mods/appbridge/test/hangupEndpoint.test.ts || status=1
python="${PYTHON:-python3}"
if "$python" -c "import fonoster.voice" 2>/dev/null; then
  # pytest -k can't take a hyphen; the id's two halves pick the same tests. A whole-area run
  # (run.cjs, QA_RUN=1) takes every test.
  if [ "${QA_RUN:-}" = 1 ]; then select=""; else select="${id%-*} and ${id#*-}"; fi
  (cd python/fonoster-voice && "$python" -m pytest -q ${select:+-k "$select"} \
    --junitxml="$out/python.xml" tests/test_server.py tests/test_conformance.py) || status=1
fi
if [ "$id" = "VSD-016" ] || { [ "${QA_RUN:-}" = 1 ] && [ -n "${PIPECAT_PYTHON:-}" ]; }; then
  npx mocha --timeout 60000 --exit --grep "\[$id\]" \
    --reporter xunit --reporter-option "output=$out/pipecat.xml" \
    mods/appbridge/test/pipecat.test.ts || status=1
fi
exit $status
