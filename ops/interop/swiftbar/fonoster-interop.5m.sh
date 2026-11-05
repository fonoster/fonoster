#!/bin/sh
# <xbar.title>Fonoster interop</xbar.title>
# <xbar.desc>New interop evidence and failures found by the host's fonoster-interop scan.</xbar.desc>
#
# Reads the host's alerts.jsonl through a forced-command ssh key every 5 minutes, shows the alerts
# not yet cleared and notifies each new one. See README.md next to this file.
set -u
CONF="$HOME/.config/fonoster-interop"
SEEN="$CONF/seen"
CLEARED="$CONF/cleared"
LAST="$CONF/last"
CHECKLIST="https://github.com/fonoster/fonoster/blob/main/mods/conformance/catalog/areas/interop.md"
SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
NAME_RE='^[a-z0-9-]+$'
CASE_RE='^IOP-[0-9]{3}$'
SIG_RE='^([0-9]{3} to [A-Z]+|no final response to INVITE|no response to INVITE|no ACK for 2xx)$'

mkdir -p "$CONF"
touch "$SEEN" "$CLEARED" "$LAST"

valid() { printf '%s\n' "$1" | grep -Eq "$2"; }

# Clear: re-validate what the menu passed, then remember it. The host is never changed.
case "${1:-}" in
  clear)
    valid "${2:-}" "$NAME_RE" && valid "${3:-}" "$CASE_RE" && echo "e $2 $3" >>"$CLEARED"
    exit 0
    ;;
  clear-failure)
    sig="$(printf '%s' "${3:-}" | tr _ ' ')"
    if valid "${2:-}" "$NAME_RE" && valid "$sig" "$SIG_RE"; then
      day="$(awk -v k="f $2 ${3:-}" 'index($0, k " ") == 1 { print $NF }' "$LAST" | tail -1)"
      [ -z "$day" ] || echo "f $2 $3 $day" >>"$CLEARED"
    fi
    exit 0
    ;;
esac

notify() { # <title> <text>, passed as arguments, never put in the script
  osascript -e 'on run argv' -e 'display notification (item 2 of argv) with title (item 1 of argv)' \
    -e 'end run' -- "$1" "$2" >/dev/null 2>&1 || true
}

ALIAS="$(sed -n 's/^FONOSTER_INTEROP_SSH=//p' "$CONF/config" 2>/dev/null | tail -1)"
if ! valid "$ALIAS" '^[A-Za-z0-9][A-Za-z0-9._-]*$'; then
  echo "IOP ?"
  echo "---"
  echo "Set FONOSTER_INTEROP_SSH in ~/.config/fonoster-interop/config"
  exit 0
fi

RAW="$(mktemp)"
trap 'rm -f "$RAW" "$RAW.v"' EXIT
if ! ssh -o BatchMode=yes -o ConnectTimeout=10 "$ALIAS" >"$RAW" 2>/dev/null; then
  echo "IOP ?"
  echo "---"
  echo "Can't reach the host; last checked $(date '+%Y-%m-%d %H:%M')"
  exit 0
fi

# JSON parsing only: one line per valid alert, fields free of spaces (a signature's spaces become _).
#   e <far_end> <case> <time> <file>
#   f <far_end> <signature> <count> <time> <file>
python3 -I -S -c '
import json, re, sys
name = re.compile(r"[a-z0-9-]+")
case = re.compile(r"IOP-[0-9]{3}")
sig = re.compile(r"[0-9]{3} to [A-Z]+|no final response to INVITE|no response to INVITE|no ACK for 2xx")
time = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?Z")
file = re.compile(r"[0-9A-Za-z:.-]+-[A-Za-z0-9._@-]{1,128}\.jsonl")
def ok(rx, v):
    return isinstance(v, str) and rx.fullmatch(v) is not None
for line in sys.stdin:
    try:
        a = json.loads(line)
    except ValueError:
        continue
    if not isinstance(a, dict) or not ok(name, a.get("far_end")) or not ok(time, a.get("time")) \
            or not ok(file, a.get("file")):
        continue
    if a.get("kind") == "failure":
        n = a.get("count")
        if ok(sig, a.get("signature")) and type(n) is int and n > 0:
            print("f", a["far_end"], a["signature"].replace(" ", "_"), n, a["time"], a["file"])
    elif ok(case, a.get("case")):
        print("e", a["far_end"], a["case"], a["time"], a["file"])
' <"$RAW" >"$RAW.v" 2>/dev/null || : >"$RAW.v"

# Evidence once per far end x case (the first line); a failure as its latest line per far end x
# signature. A failure is cleared up to a day: a later day's line reopens it.
FAILS="$(awk '$1 == "f" { k = $2 " " $3; last[k] = $0; if (!(k in seen)) { seen[k] = 1; order[n++] = k } }
  END { for (i = 0; i < n; i++) print last[order[i]] }' "$RAW.v")"
EVID="$(awk '$1 == "e" && !seen[$2 " " $3]++' "$RAW.v")"

: >"$LAST"
OPEN_F=""
OPEN_E=""
m=0
k=0
NL='
'
while read -r _ far sig count time file; do
  [ -n "$far" ] || continue
  day="${time%%T*}"
  echo "f $far $sig $day" >>"$LAST"
  cleared="$(awk -v k="f $far $sig" 'index($0, k " ") == 1 { print $NF }' "$CLEARED" | sort | tail -1)"
  [ -n "$cleared" ] && ! expr "$day" \> "$cleared" >/dev/null && continue
  m=$((m + 1))
  OPEN_F="$OPEN_F$far $sig $count $time $file$NL"
  if ! grep -qx "f $far $sig $day" "$SEEN"; then
    notify "Interop failure" "$far · $(echo "$sig" | tr _ ' ') ($count calls)"
    echo "f $far $sig $day" >>"$SEEN"
  fi
done <<EOF
$FAILS
EOF
while read -r _ far case time file; do
  [ -n "$far" ] || continue
  grep -qx "e $far $case" "$CLEARED" && continue
  k=$((k + 1))
  OPEN_E="$OPEN_E$far $case $time $file$NL"
  if ! grep -qx "e $far $case" "$SEEN"; then
    notify "New interop evidence" "$far · $case"
    echo "e $far $case" >>"$SEEN"
  fi
done <<EOF
$EVID
EOF

[ "$k" = 0 ] && [ "$m" = 0 ] && exit 0
if [ "$m" = 0 ]; then echo "IOP $k"
elif [ "$k" = 0 ]; then echo "⚠ $m"
else echo "IOP $k · ⚠ $m"
fi
echo "---"
at() { echo "$1" | sed 's/^\([0-9-]*\)T\([0-9][0-9]:[0-9][0-9]\).*/\1 \2/'; }
printf '%s' "$OPEN_F" | while read -r far sig count time file; do
  echo "Failing: $far · $(echo "$sig" | tr _ ' ') · $count calls · $(at "$time")"
  echo "-- $file"
  echo "-- Clear | bash=\"$SELF\" param1=clear-failure param2=$far param3=$sig terminal=false refresh=true"
done
printf '%s' "$OPEN_E" | while read -r far case time file; do
  echo "New evidence: $far · $case · $(at "$time")"
  echo "-- $file"
  echo "-- Open checklist | href=$CHECKLIST"
  echo "-- Clear | bash=\"$SELF\" param1=clear param2=$far param3=$case terminal=false refresh=true"
done
