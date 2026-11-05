# Interop alerts in the menu bar

`fonoster-interop.5m.sh` is a [SwiftBar](https://github.com/swiftbar/SwiftBar) plugin. Every 5
minutes it reads the alerts the host's interop scan writes (`/var/lib/fonoster-interop/alerts.jsonl`,
see `mods/conformance/catalog/areas/interop.md`), shows the ones you haven't cleared and sends a
macOS notification for each new one:

- `IOP 2` in the menu bar: two far end × case pairs with new evidence.
- `IOP 1 · ⚠ 1`: one new piece of evidence and one far end whose signaling is failing.

It reads through the `interop-alerts` account, whose key can only print `alerts.jsonl`
(`interop_alerts_authorized_key` in `ops/ansible/README.md`). It never writes to the host.

## Install

1. Install SwiftBar (`brew install --cask swiftbar`) and pick a plugin folder when it asks.
2. Link the plugin into that folder, keeping its name (the `5m` sets the refresh):

   ```sh
   ln -s "$PWD/ops/interop/swiftbar/fonoster-interop.5m.sh" "<plugin folder>/"
   ```

3. Add an alias for the host to `~/.ssh/config`, with the private half of the key you put in
   `interop_alerts_authorized_key`:

   ```
   Host <alias>
     HostName <host>
     User interop-alerts
     IdentityFile ~/.ssh/<key>
   ```

4. Name the alias in `~/.config/fonoster-interop/config`:

   ```sh
   FONOSTER_INTEROP_SSH=<alias>
   ```

Keep the alias, host and key out of this repository.

`IOP ?` means the plugin can't read the alerts: the dropdown says whether the config is missing or
the host can't be reached.

## Clearing an alert

Each alert has a **Clear** item. A cleared piece of evidence never shows again. A cleared failure
shows again when the scan reports it on a later day (it reports a failing far end at most once a
day). The plugin remembers what it notified in `~/.config/fonoster-interop/seen` and what you
cleared in `~/.config/fonoster-interop/cleared`; delete both to start over.

## Test

```sh
sh ops/interop/swiftbar/test.sh
```
