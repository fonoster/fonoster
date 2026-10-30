#!/usr/bin/env bash
# The Compose install as a self-hoster makes it (catalog area OPS,
# mods/conformance/catalog/areas/operations.md):
#
#   ops/bundle/test/install.sh <version>
#
# OPS-001  a fresh install from this build's archive starts and serves (ops/release/smoke)
#
# Builds <version> with ops/release/bundle unless dist/release/<version> has it. Needs Docker.
# JUNIT_DIR=<dir> writes install.xml there, one test per check. Exits 1 when any check failed.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
V="${1:?usage: ops/bundle/test/install.sh <version>}"
OUT="$ROOT/dist/release/$V"
WORK="$(mktemp -d)"

log() { printf '\033[1m[install]\033[0m %s\n' "$*" >&2; }

RESULTS=()
FAILED=0
record() { # <case> <name> <ok|fail> [why]
  RESULTS+=("$1|$2|$3|${4:-}")
  if [ "$3" = ok ]; then log "pass [$1] $2"; else FAILED=1; log "FAIL [$1] $2: ${4:-}"; fi
}
xml() { sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g'; }
finish() {
  [ $? = 0 ] || FAILED=1
  if [ -n "${JUNIT_DIR:-}" ]; then
    mkdir -p "$JUNIT_DIR"
    {
      echo '<?xml version="1.0" encoding="UTF-8"?>'
      echo "<testsuites name=\"operations\"><testsuite name=\"install\" tests=\"${#RESULTS[@]}\">"
      for r in "${RESULTS[@]}"; do
        IFS='|' read -r id name result why <<<"$r"
        printf '<testcase classname="install" name="%s">' "$(printf '[%s] %s' "$id" "$name" | xml)"
        [ "$result" = ok ] || printf '<failure message="%s"/>' "$(printf '%s' "$why" | head -1 | xml)"
        echo '</testcase>'
      done
      echo '</testsuite></testsuites>'
    } >"$JUNIT_DIR/install.xml"
  fi
  rm -rf "$WORK"
  log "$([ "$FAILED" = 0 ] && echo ok || echo failed)"
  exit "$FAILED"
}
trap finish EXIT

if [ ! -f "$OUT/fonoster-$V.tar.gz" ] || ! docker image inspect "fonoster/apiserver:$V" >/dev/null 2>&1; then
  log "build $V"
  "$ROOT/ops/release/bundle" "$V" || { log "ops/release/bundle $V failed"; exit 1; }
fi

# OPS-001 A fresh install from the archive starts and serves ------------------------------------
if "$ROOT/ops/release/smoke" "$V" >"$WORK/smoke.log" 2>&1; then
  record OPS-001 "a fresh install of $V starts, every service runs and the dashboard answers" ok
else
  record OPS-001 "a fresh install of $V starts, every service runs and the dashboard answers" fail "$(tail -5 "$WORK/smoke.log")"
fi
