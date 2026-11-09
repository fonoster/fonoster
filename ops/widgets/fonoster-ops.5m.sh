#!/usr/bin/env bash
# <swiftbar.title>fonoster-ops</swiftbar.title>
# <swiftbar.desc>Calls, verified users, what was built and interop alerts, from the ops API</swiftbar.desc>
# <swiftbar.hideAbout>true</swiftbar.hideAbout>
# <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
# <swiftbar.hideDisablePlugin>true</swiftbar.hideDisablePlugin>
# <swiftbar.hideSwiftBar>true</swiftbar.hideSwiftBar>
# <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
#
# SwiftBar plugin. Runs every 5 minutes (from the file name), and fetches on every run. Setup:
# ops/widgets/README.md.
#
# Called with no argument it prints the menu. The menu items call it again with one word:
#   refresh | image | copy | quit | clear <far_end> <case> | clear-failure <far_end> <signature_with_underscores>
#   | download <far_end> <case or signature_with_underscores>
# Anything else is ignored.

set -euo pipefail
PATH="$PATH:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

SELF=${BASH_SOURCE[0]}
while [ -L "$SELF" ]; do # follow the symlink SwiftBar uses
  t=$(readlink "$SELF")
  case $t in /*) SELF=$t ;; *) SELF=$(dirname "$SELF")/$t ;; esac
done
DIR=$(cd "$(dirname "$SELF")" && pwd)

case "${1:-}" in
  "")
    "$DIR/fetch.sh" fetch >/dev/null 2>&1 || true
    python3 -I "$DIR/menu.py" || echo "☎ ✕"
    ;;
  refresh)
    rm -f "$HOME/.cache/fonoster-ops/notice"
    ;;
  image)
    # The dropdown as one PNG card on the Desktop, also on the clipboard.
    out="$HOME/Desktop/Fonoster metrics $(date '+%Y-%m-%d at %H.%M.%S').png"
    if python3 -I "$DIR/menu.py" --card | "$DIR/bin/card" "$out" >/dev/null 2>&1; then
      osascript -e 'on run {p}' -e 'set the clipboard to (read (POSIX file p) as «class PNGf»)' -e 'end run' "$out" >/dev/null 2>&1 || true
    fi
    ;;
  copy)
    python3 -I "$DIR/menu.py" last-json | pbcopy
    ;;
  quit)
    osascript -e 'tell application "SwiftBar" to quit' >/dev/null 2>&1 || true
    ;;
  clear | clear-failure)
    python3 -I "$DIR/menu.py" "$1" "${2:-}" "${3:-}"
    ;;
  download)
    "$DIR/fetch.sh" download "${2:-}" "${3:-}" >/dev/null 2>&1 || true
    ;;
esac
