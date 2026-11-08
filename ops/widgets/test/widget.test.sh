#!/usr/bin/env bash
# shellcheck disable=SC2015,SC2016
# Widget tests, on macOS and Linux: curl, open, osascript and pbcopy are fakes on PATH, HOME is a temp
# folder and TZ is set. Sample numbers come from test/sample.py and are illustrative. Nothing here
# touches a real host, the real HOME, or the network.
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
SAMPLE=(python3 -I "$ROOT/test/sample.py")
PLUGIN="$ROOT/fonoster-ops.5m.sh"
WORK=$(mktemp -d)
PASS=0
FAIL=0
trap 'rm -rf "$WORK"' EXIT

export TZ=UTC
TOKEN=s0123456789abcdef0123456789abcdef
ok() { PASS=$((PASS + 1)); printf '  ok   %s\n' "$1"; }
bad() { FAIL=$((FAIL + 1)); printf '  FAIL %s\n' "$1"; }
eq() { if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (expected [$2], got [$3])"; fi; }
has() { if grep -qF -- "$3" <<<"$2"; then ok "$1"; else bad "$1 (missing: $3)"; fi; }
lacks() { if grep -qF -- "$3" <<<"$2"; then bad "$1 (found: $3)"; else ok "$1"; fi; }
perm() { stat -c '%a' "$1" 2>/dev/null || stat -f '%Lp' "$1"; }

# ---------------------------------------------------------------- fakes
mkdir -p "$WORK/bin"
# SHIM_METRICS, SHIM_ALERTS, SHIM_REC: a status code, or timeout, oversize or badwrite.
cat >"$WORK/bin/curl" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$SHIM_LOG.argv"
stdin=$(cat)
printf '%s\n' "$stdin" >>"$SHIM_LOG.stdin"
out=""
while [ $# -gt 0 ]; do
  case "$1" in -o) out=$2; shift ;; esac
  shift
done
case "$stdin" in
  *'/api/ops/metrics"'*) printf 'metrics\n' >>"$SHIM_LOG"; how=${SHIM_METRICS:-200}; body=$SHIM_DIR/metrics.json ;;
  *'/api/ops/interop/alerts"'*) printf 'alerts\n' >>"$SHIM_LOG"; how=${SHIM_ALERTS:-200}; body=$SHIM_DIR/alerts.body ;;
  *'/api/ops/interop/recordings/'*) printf 'recording\n' >>"$SHIM_LOG"; how=${SHIM_REC:-200}; body=$SHIM_DIR/recording ;;
  *) exit 99 ;;
esac
case "$how" in
  timeout) printf '000'; exit 28 ;;
  oversize) printf '200'; exit 63 ;;
  badwrite) printf '200'; exit 23 ;;
  200) cat "$body" >"$out"; printf '200'; exit 0 ;;
  *) printf '{"error":"x"}' >"$out"; printf '%s' "$how"; exit 22 ;;
esac
EOF
printf '#!/bin/sh\nprintf "%%s\\n" "$*" >>"$SHIM_LOG.open"\n' >"$WORK/bin/open"
printf '#!/bin/sh\ncat >"$SHIM_LOG.pbcopy"\n' >"$WORK/bin/pbcopy"
printf '#!/bin/sh\nprintf "%%s\\n" "$*" >>"$SHIM_LOG.osascript"\n' >"$WORK/bin/osascript"
printf '#!/bin/sh\nexit 1\n' >"$WORK/bin/pgrep"
chmod +x "$WORK"/bin/*
ORIG_PATH=$PATH

# Alerts, by name.
F488='{"kind":"failure","far_end":"telnyx","signature":"488 to INVITE","count":3,"time":"2026-11-05T14:00:00Z","file":"20261105T131010000Z-9f2e7d.jsonl"}'
F1='{"kind":"failure","far_end":"acme","signature":"no ACK for 2xx","count":1,"time":"2026-11-05T12:00:00Z","file":"20261105T120000000Z-111111.jsonl"}'
E4='{"kind":"evidence","far_end":"whatsapp","case":"IOP-004","time":"2026-11-05T14:00:00Z","file":"20261105T133702321Z-a84bc1.jsonl"}'
E5='{"kind":"evidence","far_end":"whatsapp","case":"IOP-005","time":"2026-11-05T13:39:00Z","file":"20261105T133900000Z-b00000.jsonl"}'

alerts_body() { # rows...
  local IFS=,
  printf '{"alerts":[%s]}\n' "$*"
}

# new_env NAME: a fresh HOME with a valid config, 200s and no alerts; sets H and the shim variables
new_env() {
  H="$WORK/$1"
  rm -rf "$H"
  mkdir -p "$H/.config/fonoster-ops" "$H/shim"
  printf 'url=https://api.example.com\ntoken=%s\n' "$TOKEN" >"$H/.config/fonoster-ops/config"
  export HOME="$H" SHIM_DIR="$H/shim" SHIM_LOG="$H/shim/curl.log" SHIM_METRICS=200 SHIM_ALERTS=200 SHIM_REC=200
  "${SAMPLE[@]}" one 5 >"$SHIM_DIR/metrics.json"
  alerts_body >"$SHIM_DIR/alerts.body"
  printf '{"kind":"response"}\n' >"$SHIM_DIR/recording"
  : >"$SHIM_LOG"
  PATH="$WORK/bin:$ORIG_PATH"
}
plain() { sed $'s/\x1b\\[[0-9;]*m//g'; } # the text without its ansi colors
plugin() { "$PLUGIN" "$@" 2>&1; }
menu() { plugin | plain; }
first() { head -n 1 | sed -e 's/ *| templateImage=.*/ template/' -e 's/ *| image=.*/ image/'; }
CACHE() { printf '%s' "$H/.cache/fonoster-ops"; }
curl_calls() { grep -c "^$1\$" "$SHIM_LOG" || true; }

# The pill's top-right corner: red pixels, read from the title's PNG.
red_corner() { python3 -I -c '
import base64, struct, sys, zlib
line = sys.stdin.readline()
png = base64.b64decode(line.split("image=", 1)[1].strip())
w, h = struct.unpack(">II", png[16:24])
i, idat = 8, b""
while i < len(png):
    n = struct.unpack(">I", png[i:i + 4])[0]
    if png[i + 4:i + 8] == b"IDAT":
        idat += png[i + 8:i + 8 + n]
    i += 12 + n
raw = zlib.decompress(idat)
stride = 1 + 4 * w
def px(x, y):
    return raw[y * stride + 1 + 4 * x:y * stride + 1 + 4 * x + 4]
red = sum(1 for y in range(14) for x in range(w - 14, w) if px(x, y)[0] > 200 and px(x, y)[1] < 100 and px(x, y)[3] > 200)
left = px(w - 40, 18)
print("yes" if red > 50 and not (left[0] > 200 and left[1] < 100) else "no")
'; }

# ================================================================= metrics parity
echo "validate.py parity (test/good, test/bad)"
py_valid() { python3 -I -c '
import sys
sys.path.insert(0, sys.argv[1])
import validate
o = validate.parse_line(sys.stdin.read())
print("true" if o is not None and validate.valid(o) else "false")' "$ROOT"; }
for kind in good bad; do
  n=0
  want=$([ "$kind" = good ] && echo true || echo false)
  while IFS= read -r line; do
    n=$((n + 1))
    eq "$kind line $n" "$want" "$(printf '%s' "$line" | py_valid)"
  done <"$ROOT/test/$kind/snapshots.jsonl"
done

# ================================================================= dot and title
echo "menu bar: dot (frames 1, 2)"
new_env dot
for look in Light Dark; do
  alerts_body "$E4" >"$SHIM_DIR/alerts.body"
  TITLE=$(OS_APPEARANCE=$look plugin | head -n 1)
  has "$look: an open alert uses image=" "$TITLE" "| image="
  lacks "$look: an open alert has no template" "$TITLE" "templateImage="
  eq "$look: red pixels at the pill's top-right corner" yes "$(red_corner <<<"$TITLE")"
done
new_env nodot
OUT=$(plugin)
WANT=$(python3 -I -c 'import sys; sys.path.insert(0, sys.argv[1]); import icon; print("| templateImage=" + icon.png_b64("42 97%"))' "$ROOT")
eq "no open alert: the title equals today's output" "$WANT" "$(head -n 1 <<<"$OUT")"

# ================================================================= interop section
echo "interop section (frame 4)"
new_env section
alerts_body "$E5" "$E4" "$F1" "$F488" >"$SHIM_DIR/alerts.body"
OUT=$(menu)
has "title and count" "$OUT" "● INTEROP · 4 OPEN"
has "failure row" "$OUT" "Failing 488 to INVITE · telnyx · 3 calls · 2026-11-05 14:00 |"
has "one call" "$OUT" "Failing no ACK for 2xx · acme · 1 call · 2026-11-05 12:00 |"
has "evidence row" "$OUT" "New evidence IOP-004 · whatsapp · 2026-11-05 14:00 |"
ORDER=$(grep -E '^(Failing|New evidence)' <<<"$OUT" | sed 's/ ·.*//' | tr '\n' ';')
eq "failures first, then evidence, each newest first" "Failing 488 to INVITE;Failing no ACK for 2xx;New evidence IOP-004;New evidence IOP-005;" "$ORDER"
SECTIONS=$(grep -E '^(updated |● INTEROP|CALLS)' <<<"$OUT" | sed -E 's/^(updated|● INTEROP|CALLS).*/\1/' | tr '\n' ';')
eq "between the header and CALLS" "updated;● INTEROP;CALLS;" "$SECTIONS"
has "CALLS as today" "$OUT" "42 calls |"
has "calls detail as today" "$OUT" "97% completed · avg 1m12s · 3 under 5s"
has "GROWTH as today" "$OUT" "99 verified users   +2 today · +9 in 7 days"
has "BILLING as today" "$OUT" "12 on plan · 28 on trial · 1 past due"
has "credits bought vs used" "$OUT" "\$2,500.00 bought · \$612.34 used (24%) |"
has "free credits" "$OUT" "free \$450.50 used of \$1,200.00 · \$12.00 unpaid · \$80.00 expired |"
has "activated ever" "$OUT" "31 activated ever   32% of 96 workspaces |"
has "BUILT as today" "$OUT" "40 SIP agents · 22 numbers · 9 trunks"
lacks "Open report is gone" "$OUT" "Open report"
has "refresh" "$OUT" "param1=refresh"
has "refresh re-runs" "$(grep 'Refresh now' <<<"$OUT")" "refresh=true"
new_env tzlocal
alerts_body "$E4" >"$SHIM_DIR/alerts.body"
has "times are local" "$(TZ=America/New_York "$PLUGIN" | plain)" "New evidence IOP-004 · whatsapp · 2026-11-05 09:00"

echo "submenu (frame 5)"
new_env sub
alerts_body "$F488" "$E4" >"$SHIM_DIR/alerts.body"
OUT=$(menu)
has "evidence: label" "$OUT" "--IOP-004 · whatsapp · 2026-11-05 14:00 |"
has "evidence: file" "$OUT" "--20261105T133702321Z-a84bc1.jsonl |"
has "failure: label" "$OUT" "--488 to INVITE · telnyx · 2026-11-05 14:00 |"
has "failure: file" "$OUT" "--20261105T131010000Z-9f2e7d.jsonl |"
has "download evidence" "$OUT" "--Download recording | bash=\"$ROOT/fonoster-ops.5m.sh\" param1=download param2=whatsapp param3=IOP-004"
has "download failure" "$OUT" "--Download recording | bash=\"$ROOT/fonoster-ops.5m.sh\" param1=download param2=telnyx param3=488_to_INVITE"
has "clear evidence" "$OUT" "param1=clear param2=whatsapp param3=IOP-004"
has "clear failure" "$OUT" "param1=clear-failure param2=telnyx param3=488_to_INVITE"
eq "only evidence has the checklist" 1 "$(grep -c 'Open checklist' <<<"$OUT")"
has "the checklist's anchor" "$OUT" "--Open checklist | href=https://github.com/fonoster/fonoster/blob/main/mods/conformance/catalog/areas/interop.md#iop-004"
INFO=$(grep -E '^--(IOP-004|2026|20261105T133)' <<<"$OUT")
lacks "the first two lines aren't clickable" "$INFO" "bash="

echo "open checklist anchors"
AREA="$ROOT/../../mods/conformance/catalog/areas/interop.md"
for n in 001 002 003 004 005 006 007 008 009 010 011; do
  eq "anchor iop-$n right before its heading" "### IOP-$n" "$(grep -A1 "^<a id=\"iop-$n\"></a>\$" "$AREA" | tail -n 1 | cut -d' ' -f1,2)"
done

# ================================================================= clear
echo "clear"
new_env clear1
alerts_body "$E4" >"$SHIM_DIR/alerts.body"
plugin >/dev/null
printf 'old notice\n' >"$(CACHE)/notice"
plugin clear whatsapp IOP-004
eq "appends the evidence line" "e whatsapp IOP-004" "$(cat "$H/.config/fonoster-ops/interop-cleared")"
[ ! -e "$(CACHE)/notice" ] && ok "clears the notice" || bad "notice stayed"
TITLE=$(plugin | head -n 1)
has "next menu: no dot" "$TITLE" "templateImage="
lacks "next menu: no section" "$(menu)" "INTEROP"
alerts_body "$E4" "${E4/14:00:00Z/18:00:00Z}" >"$SHIM_DIR/alerts.body"
lacks "cleared evidence never returns" "$(menu)" "INTEROP"
new_env clear2
alerts_body "$F488" >"$SHIM_DIR/alerts.body"
plugin >/dev/null
plugin clear-failure telnyx 488_to_INVITE
eq "appends the failure line with its UTC day" "f telnyx 488_to_INVITE 2026-11-05" "$(cat "$H/.config/fonoster-ops/interop-cleared")"
lacks "a row dated D stays cleared" "$(menu)" "INTEROP"
alerts_body "${F488//2026-11-05T14:00:00Z/2026-11-06T01:00:00Z}" >"$SHIM_DIR/alerts.body"
has "a row dated after D opens it" "$(menu)" "● INTEROP · 1 OPEN"
new_env counts
alerts_body "$E4" "$E5" >"$SHIM_DIR/alerts.body"
plugin >/dev/null
plugin clear whatsapp IOP-005
has "clear lowers the count" "$(menu)" "● INTEROP · 1 OPEN"

echo "parameters"
new_env params
alerts_body "$E4" >"$SHIM_DIR/alerts.body"
plugin >/dev/null
: >"$SHIM_LOG"
plugin clear whatsapp IOP-999 && ok "clear with no row exits 0" || bad "clear with no row failed"
plugin clear-failure whatsapp IOP-004 && ok "clear-failure of an evidence row exits 0" || bad "clear-failure failed"
plugin clear telnyx 488_to_INVITE && ok "clear of no row exits 0" || bad "clear failed"
plugin download whatsapp IOP-999 && ok "download with no row exits 0" || bad "download with no row failed"
plugin download '../../x' 'y' && ok "download of a hostile pair exits 0" || bad "hostile download failed"
[ ! -e "$H/.config/fonoster-ops/interop-cleared" ] && ok "nothing is written" || bad "something was written"
eq "nothing is fetched" 0 "$(wc -l <"$SHIM_LOG" | tr -d ' ')"
eq "an unknown word prints nothing" "" "$(plugin bogus)"

# ================================================================= download
echo "download (frame 7)"
FILE4=20261105T133702321Z-a84bc1.jsonl
new_env dl
alerts_body "$E4" "$F488" >"$SHIM_DIR/alerts.body"
plugin >/dev/null
: >"$SHIM_LOG"
: >"$SHIM_LOG.stdin"
: >"$SHIM_LOG.argv"
plugin download whatsapp IOP-004
eq "one recording GET" recording "$(cat "$SHIM_LOG")"
has "the token on stdin" "$(cat "$SHIM_LOG.stdin")" "Authorization: Bearer $TOKEN"
has "the row's file" "$(cat "$SHIM_LOG.stdin")" "/api/ops/interop/recordings/$FILE4\""
eq "it lands in Downloads" '{"kind":"response"}' "$(cat "$H/Downloads/$FILE4")"
eq "open -R that path" "-R $H/Downloads/$FILE4" "$(cat "$SHIM_LOG.open")"
[ -z "$(find "$(CACHE)" -name '.recording*')" ] && ok "no temp file left" || bad "temp file left"
has "the row stays open" "$(menu)" "● INTEROP · 2 OPEN"

dl_fail() { # name, shim, row far end, key, line
  new_env "$1"
  alerts_body "$E4" "$F488" >"$SHIM_DIR/alerts.body"
  plugin >/dev/null
  SHIM_REC=$2 plugin download "$3" "$4"
  [ -z "$(ls -A "$H/Downloads" 2>/dev/null)" ] && ok "$1: no file lands" || bad "$1: a file landed"
  [ ! -e "$SHIM_LOG.open" ] && ok "$1: open isn't called" || bad "$1: open was called"
  OUT=$(menu)
  has "$1: the exact line" "$OUT" "$5 |"
  has "$1: the row stays" "$OUT" "● INTEROP · 2 OPEN"
  INTEROP_NEXT=$(grep -A1 '● INTEROP' <<<"$OUT" | tail -n 1)
  has "$1: under the title" "$INTEROP_NEXT" "$5"
}
dl_fail gone 404 whatsapp IOP-004 "Recording gone: IOP-004 · whatsapp. Use Clear to dismiss it."
dl_fail gonef 404 telnyx 488_to_INVITE "Recording gone: 488 to INVITE · telnyx. Use Clear to dismiss it."
dl_fail neterr timeout whatsapp IOP-004 "Download failed: IOP-004 · whatsapp. Try again."
dl_fail refused 401 whatsapp IOP-004 "Download failed: IOP-004 · whatsapp. Try again."
dl_fail nowrite badwrite whatsapp IOP-004 "Could not save to ~/Downloads. Check SwiftBar's access and free space."
# The notice lasts until the next Download recording, Clear or Refresh now.
new_env noticed
alerts_body "$E4" "$E5" >"$SHIM_DIR/alerts.body"
plugin >/dev/null
SHIM_REC=404 plugin download whatsapp IOP-004
has "a notice survives a plain run" "$(menu)" "Recording gone"
plugin refresh
lacks "refresh clears it" "$(menu)" "Recording gone"
SHIM_REC=404 plugin download whatsapp IOP-004
plugin download whatsapp IOP-005
lacks "the next download clears it" "$(menu)" "Recording gone"
SHIM_REC=404 plugin download whatsapp IOP-004
plugin clear whatsapp IOP-005
lacks "clear clears it" "$(menu)" "Recording gone"

# ================================================================= alerts failed
echo "alerts failed (frame 6)"
alerts_case() { # name, shim, line start
  new_env "$1"
  alerts_body "$F488" "$E4" >"$SHIM_DIR/alerts.body"
  plugin >/dev/null
  CHECKED=$(TZ=UTC python3 -I -c 'import json, sys, time; print(time.strftime("%H:%M", time.gmtime(json.load(open(sys.argv[1]))["checked"])))' "$(CACHE)/alerts.json")
  [ "$2" = invalid ] && printf 'not json' >"$SHIM_DIR/alerts.body"
  export SHIM_ALERTS=$2
  [ "$2" = invalid ] && SHIM_ALERTS=200
  RAW=$(plugin)
  OUT=$(plain <<<"$RAW")
  has "$1: the numbers show" "$OUT" "42 calls"
  has "$1: warning in the menu bar" "$(head -n 1 <<<"$RAW")" "⚠"
  has "$1: the dot follows the rows" "$(head -n 1 <<<"$RAW")" "| image="
  has "$1: the rows stay" "$OUT" "● INTEROP · 2 OPEN"
  has "$1: the line" "$OUT" "$3 Last checked $CHECKED."
  [ ! -e "$H/.config/fonoster-ops/interop-cleared" ] && ok "$1: interop-cleared untouched" || bad "$1: interop-cleared changed"
}
alerts_case a503 503 "Interop scan failed on the server."
alerts_case atimeout timeout "Could not check interop alerts."
alerts_case ainvalid invalid "Could not check interop alerts."
new_env anone
export SHIM_ALERTS=503
RAW=$(plugin)
OUT=$(plain <<<"$RAW")
has "no cached alerts: warning" "$(head -n 1 <<<"$RAW")" "⚠"
has "no cached alerts: template" "$(head -n 1 <<<"$RAW")" "templateImage="
has "no cached alerts: the title" "$OUT" "INTEROP |"
has "no cached alerts: the line ends before Last checked" "$OUT" "Interop scan failed on the server. |"
new_env anone2
export SHIM_ALERTS=timeout
has "no cached alerts, other failure" "$(menu)" "Could not check interop alerts. |"

# ================================================================= metrics 503
echo "metrics 503"
new_env m503
alerts_body "$E4" >"$SHIM_DIR/alerts.body"
plugin >/dev/null
alerts_body "$E4" "$F488" >"$SHIM_DIR/alerts.body"
export SHIM_METRICS=503
RAW=$(plugin)
OUT=$(plain <<<"$RAW")
has "cached: warning" "$(head -n 1 <<<"$RAW")" "⚠"
has "cached: the numbers" "$OUT" "42 calls"
has "cached: the line" "$OUT" "The server could not read its metrics"
has "cached: the updated alerts" "$OUT" "● INTEROP · 2 OPEN"
has "cached: the dot" "$(head -n 1 <<<"$RAW")" "| image="
eq "cached: the status" metrics_failed "$(cut -d' ' -f1 "$(CACHE)/status")"
new_env m503none
export SHIM_METRICS=503
OUT=$(menu)
eq "nothing cached: no pill" "☎ ✕" "$(head -n 1 <<<"$OUT")"
has "nothing cached: the line" "$OUT" "The server could not read its metrics"
has "nothing cached: try again" "$OUT" "Try again"

# ================================================================= the status table (frame 8)
echo "errors (frame 8)"
error_row() { # name, status, message, shim value
  new_env "$1"
  export SHIM_METRICS=$4
  OUT=$(menu)
  eq "$1: the title" "☎ ✕" "$(head -n 1 <<<"$OUT")"
  has "$1: the message" "$OUT" "$3 |"
  has "$1: try again" "$OUT" "Try again | bash="
  has "$1: try again refreshes" "$(grep 'Try again' <<<"$OUT")" "param1=refresh"
  has "$1: try again re-runs" "$(grep 'Try again' <<<"$OUT")" "refresh=true"
  has "$1: quit" "$OUT" "Quit |"
  eq "$1: the status" "$2" "$(cut -d' ' -f1 "$(CACHE)/status")"
}
error_row e401 http_401 "The server refused the token in ~/.config/fonoster-ops/config" 401
error_row e404 http_404 "No ops API at that url. Check ~/.config/fonoster-ops/config" 404
error_row edown unreachable "Could not reach the server" timeout
error_row e500 http_500 "Could not update" 500
error_row ebig oversize "The server sent more data than expected, so it was ignored" oversize
new_env einvalid
printf 'not json\n' >"$SHIM_DIR/metrics.json"
OUT=$(menu)
eq "invalid: the title" "☎ ✕" "$(head -n 1 <<<"$OUT")"
has "invalid: the message" "$OUT" "The server sent no usable data"
eq "invalid: the status" no_valid_data "$(cut -d' ' -f1 "$(CACHE)/status")"
new_env keep
plugin >/dev/null
export SHIM_METRICS=401
eq "after a refused token the title is the error, never the old numbers" "☎ ✕" "$(menu | head -n 1)"
has "the good cache stays on disk" "$(cat "$(CACHE)/snapshot.json")" '"schema":1'

# ================================================================= config
echo "config"
bad_config() { # name, config text
  new_env "$1"
  printf '%b' "$2" >"$H/.config/fonoster-ops/config"
  OUT=$(menu)
  eq "$1: the title" "☎ ✕" "$(head -n 1 <<<"$OUT")"
  has "$1: setup line" "$OUT" "Setup needed: add url and token to ~/.config/fonoster-ops/config |"
  eq "$1: the status" config "$(cut -d' ' -f1 "$(CACHE)/status")"
  [ ! -e "$SHIM_LOG.argv" ] && ok "$1: curl isn't called" || bad "$1: curl was called"
}
GOODT="token=$TOKEN"
bad_config oldhost 'host=my-ssh-alias\n'
bad_config hostandmore "url=https://api.example.com\n$GOODT\nhost=x\n"
bad_config unknownkey "url=https://api.example.com\n$GOODT\ninterval_minutes=5\n"
bad_config httpurl "url=http://api.example.com\n$GOODT\n"
bad_config pathurl "url=https://api.example.com/x\n$GOODT\n"
bad_config quoteurl "url=https://a\"b\n$GOODT\n"
bad_config shorttoken 'url=https://api.example.com\ntoken=s123\n'
bad_config uppertoken "url=https://api.example.com\ntoken=S0123456789ABCDEF0123456789ABCDEF\n"
bad_config nourl "$GOODT\n"
bad_config notoken 'url=https://api.example.com\n'
new_env noconfig
rm -f "$H/.config/fonoster-ops/config"
OUT=$(menu)
eq "missing config: the title" "☎ ✕" "$(head -n 1 <<<"$OUT")"
has "missing config: setup line" "$OUT" "Setup needed"
[ ! -e "$SHIM_LOG.argv" ] && ok "missing config: curl isn't called" || bad "missing config: curl was called"

# ================================================================= requests and the token
echo "requests"
new_env req
plugin >/dev/null
eq "one metrics GET" 1 "$(curl_calls metrics)"
eq "one alerts GET" 1 "$(curl_calls alerts)"
plugin >/dev/null
eq "a second run: two more" "2 2" "$(curl_calls metrics) $(curl_calls alerts)"
has "curl's limits" "$(head -n 1 "$SHIM_LOG.argv")" "--fail-with-body --max-time 20 --max-filesize 2097152"

echo "the token"
new_env tok
alerts_body "$E4" >"$SHIM_DIR/alerts.body"
OUT=$(plugin)
plugin download whatsapp IOP-004
ARGV=$(cat "$SHIM_LOG.argv")
lacks "no argv holds the token" "$ARGV" "$TOKEN"
lacks "no argv holds the url" "$ARGV" "api.example.com"
for flag in --insecure -k -L --location; do
  if grep -qE -- "(^| )$flag( |\$)" <<<"$ARGV"; then bad "argv has $flag"; else ok "argv has no $flag"; fi
done
has "the token on stdin" "$(cat "$SHIM_LOG.stdin")" "$TOKEN"
if grep -rqF -- "$TOKEN" "$(CACHE)"; then bad "the token is in the cache"; else ok "the token is in no cached file"; fi
lacks "the token is in no plugin output" "$OUT" "$TOKEN"
eq "cache dir mode 700" 700 "$(perm "$(CACHE)")"
eq "snapshot mode 600" 600 "$(perm "$(CACHE)/snapshot.json")"
eq "alerts mode 600" 600 "$(perm "$(CACHE)/alerts.json")"
eq "status mode 600" 600 "$(perm "$(CACHE)/status")"

# ================================================================= unsafe alert text
echo "unsafe alert text"
new_env unsafe
python3 -I - "$SHIM_DIR/alerts.body" <<PY
import json, sys
good = json.loads('''$E4''')
fail = json.loads('''$F488''')
rows = [good, fail]
def mod(base, **kw):
    r = dict(base); r.update(kw); return r
rows += [
    mod(good, case="IOP-001|bash=/bin/sh"),
    mod(good, case="IOP-002\\\\x"),
    mod(good, case="IOP-003\nbash=x"),
    mod(good, case="IOP-006\x1b[31m"),
    mod(good, far_end="a|b"),
    mod(good, far_end="UPPER"),
    mod(good, case="IOP-007", file="../../etc/passwd-x.jsonl"),
    mod(good, case="IOP-008", file="a-b.jsonl|x"),
    mod(good, case="IOP-009", time="soon"),
    mod(good, case="IOP-010", time="2026-13-45T99:00:00Z"),
    mod(good, case="IOP-011", extra="key"),
    mod(good, kind="other", case="IOP-012"),
    mod(fail, far_end="bool", count=True),
    mod(fail, far_end="zero", count=0),
    mod(fail, far_end="neg", count=-1),
    mod(fail, far_end="flt", count=1.5),
    mod(fail, far_end="sig", signature="200 to INVITE; rm -rf"),
    mod(fail, far_end="nosig", signature="nope"),
    "not an object",
]
open(sys.argv[1], "w").write(json.dumps({"alerts": rows}))
PY
RAW=$(plugin)
OUT=$(plain <<<"$RAW")
has "the valid rows show" "$OUT" "● INTEROP · 2 OPEN"
has "the valid evidence" "$OUT" "New evidence IOP-004 · whatsapp"
has "the valid failure" "$OUT" "Failing 488 to INVITE · telnyx"
eq "alerts.json holds only the valid rows" 2 "$(python3 -I -c 'import json, sys; print(len(json.load(open(sys.argv[1]))["alerts"]))' "$(CACHE)/alerts.json")"
for bad_text in 'bash=/bin/sh' 'etc/passwd' 'rm -rf' 'UPPER' 'soon' 'extra'; do
  lacks "the menu has no $bad_text" "$RAW" "$bad_text"
  if grep -qF -- "$bad_text" "$(CACHE)/alerts.json"; then bad "alerts.json has $bad_text"; else ok "alerts.json has no $bad_text"; fi
done
plugin clear whatsapp IOP-001 && plugin clear far bool
[ ! -e "$H/.config/fonoster-ops/interop-cleared" ] && ok "they never reach interop-cleared" || bad "they reached interop-cleared"
# The cache isn't trusted either.
python3 -I - "$(CACHE)/alerts.json" <<PY
import json, sys
o = json.load(open(sys.argv[1]))
bad = dict(o["alerts"][0], case="IOP-001|bash=/bin/sh")
o["alerts"].append(bad)
json.dump(o, open(sys.argv[1], "w"))
PY
export SHIM_ALERTS=503
lacks "a tampered cache row doesn't show" "$(plugin)" "bash=/bin/sh"
python3 -I - "$ROOT" <<'PY' && ok "safe() strips separators" || bad "safe() strips separators"
import sys
sys.path.insert(0, sys.argv[1])
import menu
assert menu.safe("a|b\x1b[31m\nc\r\\d") == "ab[31mcd"
PY

# ================================================================= plugin words
echo "plugin words"
new_env words
plugin >/dev/null
plugin quit
has "quit asks SwiftBar to quit" "$(cat "$SHIM_LOG.osascript")" 'tell application "SwiftBar" to quit'
plugin copy
eq "copy puts one JSON line on the clipboard" 1 "$(wc -l <"$SHIM_LOG.pbcopy" | tr -d ' ')"
has "copied line is the last snapshot" "$(cat "$SHIM_LOG.pbcopy")" '"verified":99'
: >"$SHIM_LOG"
plugin refresh
eq "refresh itself fetches nothing: SwiftBar re-runs the plugin" 0 "$(wc -l <"$SHIM_LOG" | tr -d ' ')"
lacks "no color= in the menu (SwiftBar makes such a line clickable)" "$(plugin)" "color="

# ================================================================= install
echo "install.sh (copy out of the repo, link into SwiftBar, uninstall)"
new_env inst
IH="$WORK/install-home"
mkdir -p "$IH/plugins"
HOME="$IH" FONOSTER_OPS_PLUGIN_DIR="$IH/plugins" "$ROOT/install.sh" >/dev/null
IDEST="$IH/Library/Application Support/FonosterOps"
[ -f "$IDEST/menu.py" ] && [ -f "$IDEST/assets/logo-menu-dark.png" ] && ok "widget copied" || bad "widget not copied"
[ ! -e "$IDEST/assets/fonts" ] && ok "no fonts" || bad "fonts copied"
eq "SwiftBar link points at the copy" "$IDEST/fonoster-ops.5m.sh" "$(readlink "$IH/plugins/fonoster-ops.5m.sh")"
eq "the copy runs on its own" "☎ ✕" "$(HOME="$IH" python3 -I "$IDEST/menu.py" | head -n 1)"
HOME="$IH" FONOSTER_OPS_PLUGIN_DIR="$IH/plugins" "$ROOT/install.sh" --uninstall >/dev/null
[ ! -e "$IDEST" ] && [ ! -L "$IH/plugins/fonoster-ops.5m.sh" ] && ok "uninstall removes copy and link" || bad "uninstall left files"

echo
echo "passed: $PASS  failed: $FAIL"
[ "$FAIL" -eq 0 ]
