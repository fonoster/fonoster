#!/usr/bin/env bash
# Installs the widget so it no longer depends on this repo folder:
#   ops/widgets/install.sh              copy the widget, link it into SwiftBar
#   ops/widgets/install.sh --uninstall  remove the copy and the SwiftBar link
# The widget is copied to ~/Library/Application Support/FonosterOps. Your config
# (~/.config/fonoster-ops) and cache (~/.cache/fonoster-ops) are not touched.
# Run it again after pulling changes to update the installed copy.
set -euo pipefail

HERE=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
DEST="$HOME/Library/Application Support/FonosterOps"
PLUGIN=fonoster-ops.5m.sh
PLUGINS=${FONOSTER_OPS_PLUGIN_DIR:-$(defaults read com.ameba.SwiftBar PluginDirectory 2>/dev/null || true)}

unlink_plugin() {
  [ -n "$PLUGINS" ] || return 0
  if [ -L "$PLUGINS/$PLUGIN" ]; then rm -f "$PLUGINS/$PLUGIN"; fi
}

restart_swiftbar() {
  if pgrep -x SwiftBar >/dev/null; then
    osascript -e 'tell application "SwiftBar" to quit' >/dev/null 2>&1 || true
    sleep 1
  fi
  open -a SwiftBar 2>/dev/null || true
}

if [ "${1:-}" = "--uninstall" ]; then
  unlink_plugin
  rm -rf "$DEST"
  restart_swiftbar
  echo "Removed $DEST and the SwiftBar link."
  exit 0
fi

if [ -z "$PLUGINS" ] || [ ! -d "$PLUGINS" ]; then
  echo "SwiftBar's plugin folder was not found. Install SwiftBar (https://swiftbar.app), pick a plugin folder, then run this again." >&2
  exit 1
fi

# Fresh copy of just what the widget runs on.
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/assets"
cp "$HERE/$PLUGIN" "$HERE/fetch.sh" "$HERE/menu.py" "$HERE/data.py" "$HERE/icon.py" "$HERE/validate.py" "$STAGE/"
cp -R "$HERE/assets/." "$STAGE/assets/"
chmod 755 "$STAGE/$PLUGIN" "$STAGE/fetch.sh"

mkdir -p "$(dirname "$DEST")"
rm -rf "${DEST:?}"
mv "$STAGE" "$DEST"
trap - EXIT
chmod 755 "$DEST"

unlink_plugin
ln -s "$DEST/$PLUGIN" "$PLUGINS/$PLUGIN"
restart_swiftbar

echo "Installed the widget in $DEST and linked it into $PLUGINS."
echo "The repo folder is no longer needed by the widget."
