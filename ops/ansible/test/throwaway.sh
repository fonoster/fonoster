#!/usr/bin/env bash
# Puts the machine it runs on through the playbook, from nothing, with two local builds, and checks
# what the playbook promises (catalog area OPS, mods/conformance/catalog/areas/operations.md):
#
#   ops/ansible/test/throwaway.sh <a> [<b>]
#
# Builds the archives and images of <a> and <b> (ops/release/bundle; kept when already built),
# lints, then: plan <a>, apply <a>, apply <a> again, apply <b>, apply <a>, plus the failures (a bad
# checksum, a release with a .env name the inventory lacks, an install whose keys are not in
# /var/lib/fonoster/keys). Without <b> the version switch is not checked. The inventory is
# test/inventory.yml: this machine over a local connection.
#
# It deletes /opt/fonoster, /var/lib/fonoster and their containers and volumes first, so it runs
# only on a throwaway machine: Ubuntu 24.04 with root or sudo, Docker, Node.js and npm (for the
# bundle), ansible-core and ansible-lint on PATH, and GITHUB_ACTIONS=true or THROWAWAY=1 set.
#
# JUNIT_DIR=<dir> writes the results there (ops.xml), one test per check, each named after its case.
# Exits 1 when any check failed.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
ANSIBLE="$ROOT/ops/ansible"
A="${1:?usage: ops/ansible/test/throwaway.sh <a> [<b>]}"
B="${2:-}"
LIVE=/opt/fonoster
STATE=/var/lib/fonoster
PROJECT=fonoster
WORK="$(mktemp -d)"
SUDO=""
[ "$(id -u)" = 0 ] || SUDO=sudo

log() { printf '\033[1m[throwaway]\033[0m %s\n' "$*" >&2; }
die() { log "$*"; exit 1; }

[ "${GITHUB_ACTIONS:-}" = "true" ] || [ "${THROWAWAY:-}" = "1" ] \
  || die "this deletes $LIVE and $STATE: run it on a throwaway machine (THROWAWAY=1)"
for tool in ansible-playbook ansible-lint ansible-inventory docker rsync; do
  command -v "$tool" >/dev/null || die "$tool is not on PATH"
done

# Results ----------------------------------------------------------------------------------------
RESULTS=()
FAILED=0
record() { # <case> <name> <ok|fail> [why]
  RESULTS+=("$1|$2|$3|${4:-}")
  if [ "$3" = ok ]; then log "pass [$1] $2"; else FAILED=1; log "FAIL [$1] $2: ${4:-}"; fi
}
check() { # <case> <name> <command...>: passes when the command does
  local id="$1" name="$2"
  shift 2
  if out="$("$@" 2>&1)"; then record "$id" "$name" ok; else record "$id" "$name" fail "$(printf '%s' "$out" | tail -5)"; fi
}
xml() { sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g'; }
finish() {
  [ $? = 0 ] || FAILED=1
  if [ -n "${JUNIT_DIR:-}" ]; then
    mkdir -p "$JUNIT_DIR"
    {
      echo '<?xml version="1.0" encoding="UTF-8"?>'
      echo "<testsuites name=\"operations\"><testsuite name=\"throwaway\" tests=\"${#RESULTS[@]}\">"
      for r in "${RESULTS[@]}"; do
        IFS='|' read -r id name result why <<<"$r"
        printf '<testcase classname="throwaway" name="%s">' "$(printf '[%s] %s' "$id" "$name" | xml)"
        [ "$result" = ok ] || printf '<failure message="%s"/>' "$(printf '%s' "$why" | head -1 | xml)"
        echo '</testcase>'
      done
      echo '</testsuite></testsuites>'
    } >"$JUNIT_DIR/ops.xml"
  fi
  if [ "$FAILED" = 1 ] && $SUDO test -f "$LIVE/compose.yaml"; then
    compose ps -a >&2 || true
    compose logs --no-color --tail 40 >&2 || true
  fi
  rm -rf "$WORK"
  log "$([ "$FAILED" = 0 ] && echo ok || echo failed)"
  exit "$FAILED"
}
trap finish EXIT

# What a run on this machine looks like ---------------------------------------------------------
# docker compose in the live folder, which only root may enter.
compose() { $SUDO sh -c 'cd "$0" && exec docker compose "$@"' "$LIVE" "$@"; }
play() { # <version> <log> [ansible-playbook args]: the exit code of ansible-playbook
  local v="$1" out="$2"
  shift 2
  (cd "$ANSIBLE" && ansible-playbook -i test/inventory.yml playbooks/site.yml \
    -e "fonoster_version=$v" \
    -e "fonoster_archive=$ROOT/dist/release/$v/fonoster-$v.tar.gz" \
    -e "fonoster_common_package=$ROOT/dist/release/$v/fonoster-common-$v.tgz" "$@") >"$out" 2>&1
  local rc=$?
  log "ansible-playbook $v $* -> exit $rc ($out)"
  return $rc
}
# Each file under the live folder and its checksum: equal output, byte-identical folder.
tree_sum() { $SUDO sh -c "cd '$1' 2>/dev/null && find . -type f | LC_ALL=C sort | xargs -r sha256sum"; }
running_version() { $SUDO sed -n 's/^FONOSTER_VERSION=//p' "$LIVE/.env" | tail -1; }
image_of() { docker inspect -f '{{.Config.Image}}' "$(compose ps -q "$1")"; }
containers() { docker ps --filter "label=com.docker.compose.project=$PROJECT" --format '{{.Label "com.docker.compose.service"}} {{.ID}}' | sort; }
recap_changed() { sed -n 's/.*changed=\([0-9]*\).*/\1/p' "$1" | tail -1; }

# Builds, a clean machine, lint ------------------------------------------------------------------
for v in "$A" $B; do
  if [ -f "$ROOT/dist/release/$v/SHA256SUMS" ] && docker image inspect "fonoster/apiserver:$v" >/dev/null 2>&1; then
    log "build $v: kept"
  else
    log "build $v"
    "$ROOT/ops/release/bundle" "$v" || die "ops/release/bundle $v failed"
  fi
done

if $SUDO test -f "$LIVE/compose.yaml"; then
  compose down -v --remove-orphans >/dev/null 2>&1 || true
fi
$SUDO rm -rf "$LIVE" "$STATE"

(cd "$ANSIBLE" && ansible-lint) || die "ansible-lint failed"

# The values a plan must never print: every literal secret and vault_ value of the inventory.
SECRETS="$(cd "$ANSIBLE" && ansible-inventory -i test/inventory.yml --host throwaway | python3 -c '
import json, sys
v = json.load(sys.stdin)
vals = list(v.get("fonoster_env_secrets", {}).values()) + [x for k, x in v.items() if k.startswith("vault_")]
print("\n".join(x for x in vals if isinstance(x, str) and x and "{{" not in x))
')"
[ -n "$SECRETS" ] || die "found no secrets in test/inventory.yml to look for"

# OPS-003 Plan then apply serves the dashboard and API -------------------------------------------
if play "$A" "$WORK/plan.log" --check --diff; then
  record OPS-003 "plan $A exits 0" ok
else
  record OPS-003 "plan $A exits 0" fail "$(tail -20 "$WORK/plan.log")"
fi
leaked="$(grep -cFf <(printf '%s\n' "$SECRETS") "$WORK/plan.log" || true)"
[ "$leaked" = 0 ] && record OPS-003 "the plan prints no secret" ok \
  || record OPS-003 "the plan prints no secret" fail "$leaked line(s) of the plan output carry a secret"
! $SUDO test -e "$LIVE/compose.yaml" && record OPS-003 "the plan leaves $LIVE alone" ok \
  || record OPS-003 "the plan leaves $LIVE alone" fail "$LIVE/compose.yaml exists after --check"

if ! play "$A" "$WORK/apply-a.log"; then
  record OPS-003 "apply $A exits 0" fail "$(grep -A3 'fatal:' "$WORK/apply-a.log" | tail -8)"
  record OPS-005 "a second apply changes nothing" fail "apply $A failed"
  [ -z "$B" ] || record OPS-004 "applying $A after $B rolls back" fail "apply $A failed"
  exit 1
fi
record OPS-003 "apply $A exits 0" ok
extras="$($SUDO find "$LIVE" \( -name '*.example.*' -o -name .env.example -o -name README.md -o -path "$LIVE/config/schemas" \) -print)"
[ -z "$extras" ] && record OPS-003 "$LIVE holds no examples, README or schemas" ok \
  || record OPS-003 "$LIVE holds no examples, README or schemas" fail "$extras"
bad="$(compose ps -a --format '{{.Service}} {{.State}}' | awk '$2 != "running"')"
[ -z "$bad" ] && record OPS-003 "every service is running" ok || record OPS-003 "every service is running" fail "$bad"
$SUDO cp "$STATE/tls/ca.pem" "$WORK/ca.pem" && $SUDO chmod 644 "$WORK/ca.pem"
check OPS-003 "the dashboard answers 200 through the generated CA" \
  sh -c "[ \"\$(curl -s --cacert '$WORK/ca.pem' -o /dev/null -w '%{http_code}' https://127.0.0.1:18443/)\" = 200 ]"
grpc="$(printf '\0\0\0\0\0' | curl -s --cacert "$WORK/ca.pem" --http2 -X POST -o /dev/null -D - \
  -H 'content-type: application/grpc' -H 'te: trailers' --data-binary @- \
  https://127.0.0.1:18443/fonoster.identity.v1beta2.Identity/ExchangeCredentials | tr -d '\r' | sed -n 's/^grpc-status: //p')"
[ "$grpc" = 3 ] && record OPS-003 "the API answers gRPC through the generated CA" ok \
  || record OPS-003 "the API answers gRPC through the generated CA" fail "grpc-status: ${grpc:-none}"
env_a="$($SUDO sha256sum "$LIVE/.env" | cut -d' ' -f1)"
secrets_a="$($SUDO sh -c "cd '$STATE' && find keys tls -type f | LC_ALL=C sort | xargs sha256sum")"

# A release whose SHA256SUMS does not match: nothing reaches the live folder.
mkdir -p "$WORK/badsum"
cp "$ROOT/dist/release/$A/fonoster-$A.tar.gz" "$WORK/badsum/"
printf '%064d  fonoster-%s.tar.gz\n' 0 "$A" >"$WORK/badsum/SHA256SUMS"
before="$(tree_sum "$LIVE")"
if play "$A" "$WORK/badsum.log" -e "fonoster_archive=$WORK/badsum/fonoster-$A.tar.gz"; then
  record OPS-003 "a checksum mismatch fails before $LIVE" fail "the play passed"
elif ! grep -q "does not match" "$WORK/badsum.log"; then
  record OPS-003 "a checksum mismatch fails before $LIVE" fail "$(grep -A3 'fatal:' "$WORK/badsum.log" | tail -4)"
elif [ "$before" != "$(tree_sum "$LIVE")" ]; then
  record OPS-003 "a checksum mismatch fails before $LIVE" fail "$LIVE changed"
else
  record OPS-003 "a checksum mismatch fails before $LIVE" ok
fi

# OPS-005 A second apply changes nothing ---------------------------------------------------------
if play "$A" "$WORK/apply-a2.log"; then
  n="$(recap_changed "$WORK/apply-a2.log")"
  [ "$n" = 0 ] && record OPS-005 "a second apply changes nothing" ok \
    || record OPS-005 "a second apply changes nothing" fail "changed=$n: $(grep -B1 '^changed:' "$WORK/apply-a2.log" | grep TASK | head -5)"
else
  record OPS-005 "a second apply changes nothing" fail "$(grep -A3 'fatal:' "$WORK/apply-a2.log" | tail -4)"
fi

# Only config/routr-one.yaml changes (its override): only routr is recreated.
containers >"$WORK/containers-before"
if play "$A" "$WORK/apply-routr.log" -e throwaway_routr_logs_level=debug; then
  containers >"$WORK/containers-after"
  moved="$(comm -3 "$WORK/containers-before" "$WORK/containers-after" | awk '{print $1}' | sort -u | tr '\n' ' ')"
  [ "$moved" = "routr " ] && record OPS-005 "a changed config/routr-one.yaml recreates only routr" ok \
    || record OPS-005 "a changed config/routr-one.yaml recreates only routr" fail "recreated: ${moved:-none}"
else
  record OPS-005 "a changed config/routr-one.yaml recreates only routr" fail "$(grep -A3 'fatal:' "$WORK/apply-routr.log" | tail -4)"
fi

# OPS-004 Applying the previous version rolls back -----------------------------------------------
if [ -n "$B" ]; then
  if play "$B" "$WORK/apply-b.log"; then
    [ "$(running_version)" = "$B" ] && [ "$(image_of apiserver)" = "fonoster/apiserver:$B" ] \
      && record OPS-004 "apply $B runs $B" ok \
      || record OPS-004 "apply $B runs $B" fail ".env says $(running_version), apiserver runs $(image_of apiserver)"
  else
    record OPS-004 "apply $B runs $B" fail "$(grep -A3 'fatal:' "$WORK/apply-b.log" | tail -4)"
  fi
  secrets_b="$($SUDO sh -c "cd '$STATE' && find keys tls -type f | LC_ALL=C sort | xargs sha256sum")"
  if play "$A" "$WORK/apply-a3.log"; then
    [ "$(running_version)" = "$A" ] && [ "$(image_of apiserver)" = "fonoster/apiserver:$A" ] \
      && record OPS-004 "applying $A after $B rolls back" ok \
      || record OPS-004 "applying $A after $B rolls back" fail ".env says $(running_version), apiserver runs $(image_of apiserver)"
  else
    record OPS-004 "applying $A after $B rolls back" fail "$(grep -A3 'fatal:' "$WORK/apply-a3.log" | tail -4)"
  fi
  $SUDO grep -q " $A -> $B\$" "$STATE/deploys.log" && $SUDO grep -q " $B -> $A\$" "$STATE/deploys.log" \
    && record OPS-004 "deploys.log has $A -> $B and $B -> $A" ok \
    || record OPS-004 "deploys.log has $A -> $B and $B -> $A" fail "$($SUDO cat "$STATE/deploys.log")"
  secrets_a3="$($SUDO sh -c "cd '$STATE' && find keys tls -type f | LC_ALL=C sort | xargs sha256sum")"
  [ "$env_a" = "$($SUDO sha256sum "$LIVE/.env" | cut -d' ' -f1)" ] && [ "$secrets_a" = "$secrets_b" ] && [ "$secrets_a" = "$secrets_a3" ] \
    && [ "$secrets_a" = "$($SUDO sh -c "cd '$LIVE/config' && find keys tls -type f | LC_ALL=C sort | xargs sha256sum")" ] \
    && record OPS-004 ".env, keys and TLS are byte-identical across the applies" ok \
    || record OPS-004 ".env, keys and TLS are byte-identical across the applies" fail "a file differs"
fi

# A release that adds a .env name the inventory lacks: the play names it, the live folder stays.
mkdir -p "$WORK/newname/x"
tar -xzf "$ROOT/dist/release/$A/fonoster-$A.tar.gz" -C "$WORK/newname/x"
echo "OPS_THROWAWAY_NEW_NAME=1" >>"$WORK/newname/x/fonoster/.env.example"
tar -czf "$WORK/newname/fonoster-$A.tar.gz" -C "$WORK/newname/x" fonoster
(cd "$WORK/newname" && sha256sum "fonoster-$A.tar.gz" >SHA256SUMS)
before="$(tree_sum "$LIVE")"
if play "$A" "$WORK/newname.log" -e "fonoster_archive=$WORK/newname/fonoster-$A.tar.gz"; then
  record OPS-004 "a new .env name fails, naming it" fail "the play passed"
elif ! grep -q "adds OPS_THROWAWAY_NEW_NAME" "$WORK/newname.log"; then
  record OPS-004 "a new .env name fails, naming it" fail "$(grep -A3 'fatal:' "$WORK/newname.log" | tail -4)"
elif [ "$before" != "$(tree_sum "$LIVE")" ]; then
  record OPS-004 "a new .env name fails, naming it" fail "$LIVE changed"
else
  record OPS-004 "a new .env name fails, naming it" ok
fi

# An install whose keys are not in the state folder yet: the play names it, the live folder stays.
$SUDO mv "$STATE/keys" "$STATE/keys.saved" && $SUDO mkdir -m 0700 "$STATE/keys"
before="$(tree_sum "$LIVE")"
if play "$A" "$WORK/nokeys.log"; then
  record OPS-004 "empty $STATE/keys over an install fails, naming it" fail "the play passed"
elif ! grep -q "$STATE/keys is empty" "$WORK/nokeys.log"; then
  record OPS-004 "empty $STATE/keys over an install fails, naming it" fail "$(grep -A3 'fatal:' "$WORK/nokeys.log" | tail -4)"
elif [ "$before" != "$(tree_sum "$LIVE")" ]; then
  record OPS-004 "empty $STATE/keys over an install fails, naming it" fail "$LIVE changed"
else
  record OPS-004 "empty $STATE/keys over an install fails, naming it" ok
fi
$SUDO rmdir "$STATE/keys" && $SUDO mv "$STATE/keys.saved" "$STATE/keys"
