#!/bin/sh
# Tests the SwiftBar plugin with a fake ssh and osascript on PATH and HOME in a temp folder.
# Usage: sh ops/interop/swiftbar/test.sh
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
PLUGIN="$HERE/fonoster-interop.5m.sh"
T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/bin"
cat >"$T/bin/ssh" <<'EOF'
#!/bin/sh
[ "${FAKE_SSH_RC:-0}" = 0 ] || exit "$FAKE_SSH_RC"
cat "$FAKE_SSH_OUT"
EOF
cat >"$T/bin/osascript" <<'EOF'
#!/bin/sh
shift 6 # -e 'on run argv' -e '...' -e 'end run'
[ "$1" = -- ] && shift
printf '%s|%s\n' "$1" "$2" >>"$FAKE_OSA_LOG"
EOF
chmod +x "$T/bin/ssh" "$T/bin/osascript"

fails=0
pass() { echo "pass $1"; }
fail() { echo "FAIL $1: $2"; fails=$((fails + 1)); }

reset() {
  rm -rf "$T/home"
  mkdir -p "$T/home/.config/fonoster-interop"
  echo "FONOSTER_INTEROP_SSH=test-alias" >"$T/home/.config/fonoster-interop/config"
  : >"$T/alerts"
  : >"$T/osa"
  FAKE_SSH_RC=0
}
run() { # [args]: the plugin's output
  HOME="$T/home" PATH="$T/bin:$PATH" FAKE_SSH_OUT="$T/alerts" FAKE_SSH_RC="$FAKE_SSH_RC" \
    FAKE_OSA_LOG="$T/osa" sh "$PLUGIN" "$@"
}
title() { run | head -1; }

EV1='{"time":"2026-11-05T14:00:12Z","kind":"evidence","far_end":"whatsapp","case":"IOP-004","file":"20261105T133702Z-a84bc1.jsonl","findings":["sip-connect/request-uri-e164"]}'
EV2='{"time":"2026-11-05T14:00:12Z","kind":"evidence","far_end":"whatsapp","case":"IOP-005","file":"20261105T133900Z-b1c2d3.jsonl","findings":[]}'
FA1='{"time":"2026-11-05T14:00:12Z","kind":"failure","far_end":"telnyx","signature":"488 to INVITE","count":3,"file":"20261105T131010Z-9f2e7d.jsonl","findings":[]}'
FA2='{"time":"2026-11-06T09:00:00Z","kind":"failure","far_end":"telnyx","signature":"488 to INVITE","count":1,"file":"20261106T085000Z-0a0b0c.jsonl","findings":[]}'

# Two valid evidence lines (and a repeat after a crash).
reset
printf '%s\n%s\n%s\n' "$EV1" "$EV2" "$EV1" >"$T/alerts"
out="$(run)"
t="$(echo "$out" | head -1)"
[ "$t" = "IOP 2" ] && pass "two alerts: title IOP 2" || fail "two alerts: title IOP 2" "$t"
n="$(echo "$out" | grep -c '^New evidence: whatsapp · IOP-00[45] · 2026-11-05 14:00')"
[ "$n" = 2 ] && pass "two alerts: both listed once" || fail "two alerts: both listed once" "$out"
n="$(grep -c '^New interop evidence|whatsapp · IOP-00[45]$' "$T/osa")"
[ "$n" = 2 ] && pass "two alerts: two notifications" || fail "two alerts: two notifications" "$(cat "$T/osa")"

# An alert already seen is not notified again.
: >"$T/osa"
run >/dev/null
[ ! -s "$T/osa" ] && pass "seen: no notification" || fail "seen: no notification" "$(cat "$T/osa")"

# Unsafe text in a field drops the line, and nothing runs.
reset
rm -f "$T/x"
printf '%s\n' "$EV1" | sed 's#"file":"[^"]*"#"file":"a| bash=/usr/bin/touch '"$T"'/x.jsonl"#' >"$T/alerts"
printf '%s\n' "$EV2" | sed 's/"file":"[^"]*"/"file":"\\u001b[31m-x.jsonl"/' >>"$T/alerts"
printf '%s\n' "$EV2" | sed 's/"far_end":"whatsapp"/"far_end":"wa | bash=x"/' >>"$T/alerts"
out="$(run)"
[ -z "$out" ] && [ ! -e "$T/x" ] && [ ! -s "$T/osa" ] && pass "unsafe lines dropped" \
  || fail "unsafe lines dropped" "out=$out osa=$(cat "$T/osa")"

# A cleared pair isn't shown, and Clear refuses an invalid pair.
reset
printf '%s\n%s\n' "$EV1" "$EV2" >"$T/alerts"
run clear whatsapp IOP-004
run clear 'bad name' IOP-005
out="$(run)"
echo "$out" | grep -q 'IOP-004' && fail "cleared: not shown" "$out" || pass "cleared: not shown"
[ "$(echo "$out" | head -1)" = "IOP 1" ] && pass "cleared: title IOP 1" || fail "cleared: title IOP 1" "$out"
grep -q 'bad' "$T/home/.config/fonoster-interop/cleared" && fail "clear validates" "wrote an invalid pair" \
  || pass "clear validates"

# One evidence and one failure: failures first.
reset
printf '%s\n%s\n' "$EV1" "$FA1" >"$T/alerts"
out="$(run)"
[ "$(echo "$out" | head -1)" = "IOP 1 · ⚠ 1" ] && pass "mixed: title" || fail "mixed: title" "$(echo "$out" | head -1)"
first="$(echo "$out" | grep -E '^(Failing|New evidence):' | head -1)"
[ "$first" = "Failing: telnyx · 488 to INVITE · 3 calls · 2026-11-05 14:00" ] && pass "mixed: failure first" \
  || fail "mixed: failure first" "$first"
echo "$out" | grep -q 'param1=clear-failure param2=telnyx param3=488_to_INVITE ' && pass "mixed: failure Clear params" \
  || fail "mixed: failure Clear params" "$out"
grep -qx 'Interop failure|telnyx · 488 to INVITE (3 calls)' "$T/osa" && pass "mixed: failure notification" \
  || fail "mixed: failure notification" "$(cat "$T/osa")"

# A cleared failure reopens on a later day's line.
run clear-failure telnyx 488_to_INVITE
out="$(run)"
echo "$out" | grep -q '^Failing:' && fail "failure cleared" "$out" || pass "failure cleared"
: >"$T/osa"
printf '%s\n' "$FA2" >>"$T/alerts"
out="$(run)"
echo "$out" | grep -q '^Failing: telnyx · 488 to INVITE · 1 calls · 2026-11-06 09:00' && pass "failure reopens next day" \
  || fail "failure reopens next day" "$out"
grep -qx 'Interop failure|telnyx · 488 to INVITE (1 calls)' "$T/osa" && pass "failure notifies again" \
  || fail "failure notifies again" "$(cat "$T/osa")"

# No config; ssh unreachable.
reset
rm "$T/home/.config/fonoster-interop/config"
out="$(run)"
[ "$(echo "$out" | head -1)" = "IOP ?" ] && echo "$out" | grep -q 'Set FONOSTER_INTEROP_SSH in ~/.config/fonoster-interop/config' \
  && pass "no config" || fail "no config" "$out"
reset
FAKE_SSH_RC=255
out="$(run)"
[ "$(echo "$out" | head -1)" = "IOP ?" ] && echo "$out" | grep -q "^Can't reach the host; last checked " \
  && pass "ssh fails" || fail "ssh fails" "$out"

[ "$fails" = 0 ] && echo "all passed" || { echo "$fails failed"; exit 1; }
