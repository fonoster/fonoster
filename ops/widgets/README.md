# fonoster-ops widget

A SwiftBar plugin for the owner's Mac: Fonoster's live metrics and a red dot when interop has
something you haven't cleared, all over HTTPS from the ops API (`mods/ops/README.md`).

## Install

SwiftBar and python3, then:

```sh
ops/widgets/install.sh
```

## Config

`~/.config/fonoster-ops/config`, parsed, never sourced; `chmod 600` the file:

```
url=https://api.example.com
token=s0123456789abcdef0123456789abcdef
```

`token=` is `OPS_SECRET` (`ops/cloud/README.md`, Ops API). `/api/ops/...` is appended to `url`. Keep
the URL and token out of this repository.

## Reading it

- **Red dot:** an interop alert is open.
- **`⚠`:** the metrics or the alerts couldn't be read on the last fetch; the menu says which.
- **`☎ ✕`:** no numbers to show; the menu says why.

Times are local; a failure's day is UTC.

## Save as image

**Save as image** puts the dropdown on your Desktop as a PNG card, without the menu items, and copies it
to the clipboard. `install.sh` builds the card tool (`card.swift`) with `swiftc`; without the Xcode command
line tools (`xcode-select --install`) the menu leaves the item out.

## Recordings

A downloaded recording is a real call. Keep it private until it is sanitized (`interop.md`, step 4).
Routr keeps recordings 30 days by default, so **Download recording** on an older alert finds nothing.

## Clear

Evidence is cleared forever; a failure reopens on a later UTC day. Deleting a line from
`~/.config/fonoster-ops/interop-cleared` brings its row back.

## Test

```sh
bash ops/widgets/test/widget.test.sh
```

The design is `designs/widget.nib`.

## Retiring the old collector and SSH widget

Do this once, by hand, after this widget shows live numbers. Nothing in a release or the playbook
does it, and it isn't needed on any other install.

### 1. On the host, as root

Note the database user and the reader account first:

```sh
grep '^PGUSER=' /etc/fonoster-metrics/.env
stat -c %G /var/lib/fonoster-metrics
cat /etc/sudoers.d/fonoster-metrics
```

Copy `/var/lib/fonoster-metrics/snapshots.jsonl` off the host if you want its history. Then:

```sh
systemctl disable --now fonoster-metrics.timer
rm -f /etc/systemd/system/fonoster-metrics.service /etc/systemd/system/fonoster-metrics.timer
systemctl daemon-reload
rm -f /etc/sudoers.d/fonoster-metrics
rm -rf /etc/fonoster-metrics /usr/local/lib/fonoster-metrics /var/lib/fonoster-metrics
```

The SSH reader is whichever account you gave the installer; by default that was your own login. If
you created it only for the widget, run `userdel -r <reader>`. If it is `root` or an account you use
for anything else, keep it and delete only the widget's line from its `~/.ssh/authorized_keys`.

### 2. Rotate the database admin password

The old `.env` held the admin user's password (the `PGUSER` you noted). Search the private inventory
for that user first: anything still connecting with it breaks when the password changes, so move it
to its own user before rotating. Then rotate the password in the managed database's control panel.
The read-only `fonoster_ops` user is not affected.

### 3. Archive the old repository

```sh
gh repo archive fonoster/metrics --yes
```

### 4. On the Mac

```sh
PLUGINS="$(defaults read com.ameba.SwiftBar PluginDirectory)"
rm -f "$PLUGINS/FonosterMetrics.5m.sh" "$PLUGINS/fonoster-metrics.5m.sh" "$PLUGINS/fonoster-interop.5m.sh"
rm -rf "$HOME/Library/Application Support/FonosterMetrics" "$HOME/Applications/FonosterMetrics.app"
rm -rf "$HOME/.config/fonoster-metrics" "$HOME/.cache/fonoster-metrics" "$HOME/.config/fonoster-interop"
```

Remove the old host alias and key from `~/.ssh/config` and `~/.ssh`. The launcher app is gone, so
start the widget with `open -a SwiftBar`. The old installer also hid SwiftBar's own icon;
`defaults delete com.ameba.SwiftBar HideSwiftBarIcon` brings it back.
