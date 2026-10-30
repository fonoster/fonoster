#!/usr/bin/env bash
# The Compose install as a self-hoster makes it (catalog area OPS,
# mods/conformance/catalog/areas/operations.md):
#
#   ops/bundle/test/install.sh <version>
#
# OPS-001  a fresh install from this build's archive starts and serves (ops/release/smoke)
# OPS-002  an install of the latest published release, with an edited config/fonoster.yaml and
#          SIP_PORT=19002, upgraded to this build with the documented commands (unpack next to it;
#          copy .env, config/keys, config/tls and the edited file; ./init.sh; docker compose up)
#          keeps .env, the keys, the certificates, the edited file and the SIP port, and serves
#
# Builds <version> with ops/release/bundle unless dist/release/<version> has it. Needs Docker,
# Node.js (the previous release installs with its npx fonoster-config) and the network.
# JUNIT_DIR=<dir> writes install.xml there, one test per check. Exits 1 when any check failed.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
V="${1:?usage: ops/bundle/test/install.sh <version>}"
OUT="$ROOT/dist/release/$V"
WORK="$(mktemp -d)"
PROJECT=fonoster-upgrade
BASE=19000
HTTPS_PORT=$((BASE + 1))

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
  for d in "$WORK/next" "$WORK/old/fonoster"; do
    [ -f "$d/compose.yaml" ] && (cd "$d" && docker compose down -v --remove-orphans >/dev/null 2>&1)
  done
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

# OPS-002 An install of the previous release upgrades in place ----------------------------------
prev="$(curl -fsSL https://api.github.com/repos/fonoster/fonoster/releases/latest | sed -n 's/.*"tag_name": *"v\([^"]*\)".*/\1/p')"
[ -n "$prev" ] || { record OPS-002 "the previous release is published" fail "no latest release"; exit 1; }
log "previous release $prev"
mkdir -p "$WORK/old"
curl -fsSL "https://github.com/fonoster/fonoster/releases/download/v$prev/fonoster-$prev.tar.gz" | tar -xz -C "$WORK/old" \
  || { record OPS-002 "the previous release is published" fail "could not download v$prev"; exit 1; }
OLD="$WORK/old/fonoster"
cat >"$OLD/.env" <<EOF
COMPOSE_PROJECT_NAME=$PROJECT
SUBNET_PREFIX=10.216.29
HTTPS_PORT=$HTTPS_PORT
HTTPS_REDIRECT_PORT=$((BASE + 6))
HTTP_PORT=$((BASE + 7))
PUBLIC_URL=https://127.0.0.1:$HTTPS_PORT
SIP_PORT=$((BASE + 2))
NATS_PORT=$((BASE + 3))
MINIO_PORT=$((BASE + 4))
MINIO_CONSOLE_PORT=$((BASE + 5))
RTPENGINE_PORT_MIN=$((BASE + 10))
RTPENGINE_PORT_MAX=$((BASE + 39))
ROOMR_RTP_PORT_MIN=$((BASE + 40))
ROOMR_RTP_PORT_MAX=$((BASE + 69))
EOF
# An edit of the operator's, as the previous release took it (config/overrides).
mkdir -p "$OLD/config/overrides"
printf 'logs: { level: debug }\n' >"$OLD/config/overrides/fonoster.yaml"
if (cd "$OLD" && if [ -x init.sh ]; then ./init.sh --host-ip 127.0.0.1; else npx -y -p "@fonoster/common@$prev" fonoster-config init --host-ip 127.0.0.1; fi \
  && docker compose up -d --quiet-pull --wait --wait-timeout 900) >"$WORK/old.log" 2>&1; then
  record OPS-002 "the previous release ($prev) installs and starts" ok
else
  record OPS-002 "the previous release ($prev) installs and starts" fail "$(tail -5 "$WORK/old.log")"
  exit 1
fi

# The documented upgrade.
NEXT="$WORK/next"
mkdir -p "$NEXT"
if (tar -xzf "$OUT/fonoster-$V.tar.gz" -C "$NEXT" --strip-components=1 \
  && cp -a "$OLD/.env" "$NEXT/" && cp -a "$OLD/config/keys" "$OLD/config/tls" "$NEXT/config/" \
  && cp "$OLD/config/fonoster.yaml" "$NEXT/config/fonoster.yaml" \
  && cd "$NEXT" && ./init.sh && docker compose up -d --remove-orphans --wait --wait-timeout 900) >"$WORK/next.log" 2>&1; then
  record OPS-002 "the upgrade commands run and every service starts" ok
else
  record OPS-002 "the upgrade commands run and every service starts" fail "$(tail -5 "$WORK/next.log")"
fi

expected="$(sed "s/^FONOSTER_VERSION=.*/FONOSTER_VERSION=$V/" "$OLD/.env")"
case "$(cat "$NEXT/.env")" in
"$expected"*) record OPS-002 ".env keeps every line, FONOSTER_VERSION moves to $V" ok ;;
*) record OPS-002 ".env keeps every line, FONOSTER_VERSION moves to $V" fail "$(diff <(printf '%s\n' "$expected") "$NEXT/.env" | head -5)" ;;
esac
if diff -r "$OLD/config/keys" "$NEXT/config/keys" >/dev/null && diff -r "$OLD/config/tls" "$NEXT/config/tls" >/dev/null; then
  record OPS-002 "the keys and certificates are byte-identical" ok
else
  record OPS-002 "the keys and certificates are byte-identical" fail "config/keys or config/tls differs"
fi
grep -q "level: debug" "$NEXT/config/fonoster.yaml" \
  && record OPS-002 "the edited config/fonoster.yaml is the one that runs" ok \
  || record OPS-002 "the edited config/fonoster.yaml is the one that runs" fail "no logs.level: debug"
[ "$(grep -c "port: $((BASE + 2))" "$NEXT/config/routr-edgeport.yaml")" = 2 ] \
  && record OPS-002 "routr-edgeport.yaml keeps SIP_PORT $((BASE + 2))" ok \
  || record OPS-002 "routr-edgeport.yaml keeps SIP_PORT $((BASE + 2))" fail "$(grep -n 'port:' "$NEXT/config/routr-edgeport.yaml")"
image="$(cd "$NEXT" && docker inspect -f '{{.Config.Image}}' "$(docker compose ps -q apiserver)" 2>/dev/null)"
[ "$image" = "fonoster/apiserver:$V" ] \
  && record OPS-002 "the API server runs $V" ok || record OPS-002 "the API server runs $V" fail "runs ${image:-nothing}"
code="$(curl -s --cacert "$NEXT/config/tls/ca.pem" -o /dev/null -w '%{http_code}' "https://127.0.0.1:$HTTPS_PORT/" || true)"
[ "$code" = 200 ] && record OPS-002 "the dashboard answers 200 through the kept CA" ok \
  || record OPS-002 "the dashboard answers 200 through the kept CA" fail "HTTP $code"
