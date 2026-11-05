#!/usr/bin/env bash
#
# Talks to the ops API and keeps a validated copy of what it answers in ~/.cache/fonoster-ops.
#
#   fetch.sh fetch                              GET metrics and alerts
#   fetch.sh download <far_end> <case or signature_with_underscores>
#                                               GET that row's recording, into ~/Downloads
#
# The url and the token come from ~/.config/fonoster-ops/config, parsed, never sourced:
#   url=https://api.example.com
#   token=s0123456789abcdef0123456789abcdef
#
# They reach curl only on stdin (--config -), written with the shell's builtin, never as arguments.
# Everything fetched is validated (validate.py) before it is stored.
#
# ~/.cache/fonoster-ops/status is "<metrics status> <epoch> <alerts status>": metrics ok, config,
# http_<n>, unreachable, metrics_failed, oversize, no_valid_data or python; alerts ok, scan_failed
# or check_failed.

set -euo pipefail
umask 077

[ -n "${HOME:-}" ] || exit 1
MODE=${1:-}
case "$MODE" in
  fetch | download) ;;
  *) echo "usage: fetch.sh fetch | download <far_end> <key>" >&2; exit 2 ;;
esac

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
CONFIG=$HOME/.config/fonoster-ops/config
CACHE=$HOME/.cache/fonoster-ops
MAX_BYTES=2097152

mkdir -p "$CACHE"
chmod 700 "$CACHE"

write_status() { # <metrics> <alerts>
  local tmp
  tmp=$(mktemp "$CACHE/.status.XXXXXX")
  printf '%s %s %s\n' "$1" "$(date +%s)" "$2" >"$tmp"
  mv "$tmp" "$CACHE/status"
}

URL="" TOKEN=""
load_config() { # parsed, never sourced; returns 1 on a missing file, another key or a bad value
  local line key val
  [ -f "$CONFIG" ] || return 1
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in '' | '#'*) continue ;; esac
    key=${line%%=*}
    val=${line#*=}
    [ "$key" != "$line" ] || return 1
    case "$key" in
      url) URL=$val ;;
      token) TOKEN=$val ;;
      *) return 1 ;;
    esac
  done <"$CONFIG"
  [[ $URL =~ ^https://[A-Za-z0-9.:-]+$ ]] && [[ $TOKEN =~ ^s[0-9a-f]{32}$ ]]
}

RC=0
get() { # <path> <out file> [curl args]: sets RC and CODE
  local target=$1 out=$2
  shift 2
  RC=0
  CODE=$(printf 'url = "%s%s"\nheader = "Authorization: Bearer %s"\n' "$URL" "$target" "$TOKEN" \
    | curl -s --config - --fail-with-body --max-time 20 "$@" -o "$out" -w '%{http_code}') || RC=$?
}

if [ "$MODE" = download ]; then
  row=$(python3 -I "$HERE/menu.py" row "${2:-}" "${3:-}") || exit 0
  [ -n "$row" ] || exit 0
  file=${row%%$'\t'*}
  label=${row#*$'\t'}
  rm -f "$CACHE/notice"
  notice() { printf '%s\n' "$1" >"$CACHE/notice"; }
  load_config || { notice "Download failed: $label. Try again."; exit 0; }

  tmp=$(mktemp "$CACHE/.recording.XXXXXX")
  trap 'rm -f "$tmp"' EXIT
  get "/api/ops/interop/recordings/$file" "$tmp"
  if [ "$RC" -eq 0 ] && [ "$CODE" = 200 ]; then
    dest=$HOME/Downloads/$file
    if mkdir -p "$HOME/Downloads" 2>/dev/null && mv -f "$tmp" "$dest" 2>/dev/null; then
      open -R "$dest"
    else
      notice "Could not save to ~/Downloads. Check SwiftBar's access and free space."
    fi
  elif [ "$RC" -eq 23 ]; then
    notice "Could not save to ~/Downloads. Check SwiftBar's access and free space."
  elif [ "$CODE" = 404 ]; then
    notice "Recording gone: $label. Use Clear to dismiss it."
  else
    notice "Download failed: $label. Try again."
  fi
  exit 0
fi

command -v python3 >/dev/null 2>&1 || { write_status python check_failed; exit 1; }
load_config || { write_status config check_failed; exit 1; }

raw=$(mktemp "$CACHE/.raw.XXXXXX")
out=$(mktemp "$CACHE/.out.XXXXXX")
trap 'rm -f "$raw" "$out"' EXIT

# ---------------------------------------------------------------- metrics
METRICS=ok
get /api/ops/metrics "$raw" --max-filesize "$MAX_BYTES"
if [ "$RC" -eq 63 ] || [ "$(wc -c <"$raw" | tr -d ' ')" -gt "$MAX_BYTES" ]; then
  METRICS=oversize
elif [ "$RC" -ne 0 ] && [ "$RC" -ne 22 ]; then
  METRICS=unreachable
elif [ "$CODE" = 503 ]; then
  METRICS=metrics_failed
elif [ "$CODE" != 200 ]; then
  METRICS=http_$CODE
elif python3 -I "$HERE/validate.py" snapshot <"$raw" >"$out" && [ -s "$out" ]; then
  chmod 600 "$out"
  mv "$out" "$CACHE/snapshot.json"
  out=$(mktemp "$CACHE/.out.XXXXXX")
else
  METRICS=no_valid_data
fi

# ---------------------------------------------------------------- alerts: their own result
ALERTS=check_failed
: >"$raw"
get /api/ops/interop/alerts "$raw" --max-filesize "$MAX_BYTES"
if [ "$RC" -ne 0 ] && [ "$RC" -ne 22 ]; then
  ALERTS=check_failed
elif [ "$CODE" = 503 ]; then
  ALERTS=scan_failed
elif [ "$CODE" = 200 ] && python3 -I "$HERE/validate.py" alerts "$(date +%s)" <"$raw" >"$out" && [ -s "$out" ]; then
  chmod 600 "$out"
  mv "$out" "$CACHE/alerts.json"
  out=$(mktemp "$CACHE/.out.XXXXXX")
  ALERTS=ok
fi

write_status "$METRICS" "$ALERTS"
