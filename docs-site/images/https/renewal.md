# Asset build doc — renewal

**Artifact:** `renewal-dark.png`, `renewal-light.png` (this folder)
**Used on:** `self-hosting/https`
**Type:** diagram · flow (two rows)
**Preset:** 16:9 1600 × 900 (exported at 1×)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `R9dgNx` (dark), `H4G1ug` (light) (file: `designs/docs.pen`)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

## One message

Envoy holds one certificate for every name; certbot renews it on a timer, and two hooks stop and recreate Envoy so it loads the new files.

## Sources (ground truth)

- `docs-site/self-hosting/https.mdx`
- `ops/bundle/compose.tls.yaml`, `ops/bundle/config/envoy-tls.yaml`
- The production setup on 2026-10-24 (certbot standalone, hooks in `/etc/letsencrypt/renewal-hooks/{pre,post}`).

## Node / edge spec

```
Group SERVING:
  Browser / SDK (globe) —[HTTPS · app.example.com, api.example.com]→ Envoy (accent, lock, "holds the certificate") → Dashboard · API (monitor, "plain HTTP inside")
Group RENEWING · CERTBOT TIMER, TWICE A DAY:
  certbot timer (timer) → Pre hook (pause, "stops Envoy (port 80)") → certbot renews (refresh-cw, "Let's Encrypt, port 80") → Post hook (play, "recreates Envoy")
  Post hook —[loads the new certificate]↑ Envoy
Note: each renewal takes the dashboard and API offline for about 10 seconds; calls don't go through Envoy.
```

## Built from

Diagram/Node sEKX6, Diagram/Node Accent pifOQ, Diagram/Pill V8p0b, Diagram/Group np3qG, Diagram/Arrow R oSkeo, Diagram/Arrow D AdWAH (rotated 180° for the up arrow).
Nodes are 250 wide so every sub-label stays on one line (the Node's text column wraps at 178 px). Edges are 2px `$ui:accent` rectangles.
Light = copy of dark with `theme: { "ui:mode": "light" }`.

## Re-export

`Export([R9dgNx, H4G1ug], "png", "docs-site/images/https", { scale: 1 })`, then rename to `renewal-dark.png` / `renewal-light.png`.
