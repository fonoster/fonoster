# Asset build doc — save-secret

**Artifact:** `save-secret-dark.png`, `save-secret-light.png` (this folder)
**Used on:** `workspace/access`
**Type:** screenshot · copied from the dashboard design
**Preset:** dialog 560 wide on a 32px backdrop, exported at 2×
**Pencil node id:** `UyPwL` (dark), `Dc3cl` (light) (file: `designs/docs.pen`, frames "Docs / Access / Screen · Save secret / Dark" and "… / Light")
**Source screen:** `designs/dashboard.pen` → "API keys / Create / Created once" (`VukPw`), read only; dashboard.pen is never edited.

> Regenerate from this doc. Re-copy from dashboard.pen when the screen changes, then re-export.

## One message

Copy the secret now; it isn't shown again.

## What was copied

The Save your secret key dialog only.

Sample data swapped in: API key APq7d0k2m9x4c8v1b6n3z5l0w2e7r9t4, a made-up secret, accessKeyId WO7d2kq9….

Colors and fonts are `$ui:` tokens from the `ui` library (fonoster.lib.pen), so the frame's
`theme: { "ui:mode": … }` gives light and dark. The dashboard design is dark; light is the same frame
with the theme switched (the design system defines both modes, and dashboard.pen has a light-mode screen).

## Re-export

```
Export(["UyPwL", "Dc3cl"], "png", "<dir>", {scale: 2})
```
Then rename to `save-secret-dark.png` / `save-secret-light.png`.
