# Asset build doc — sip-names

**Artifact:** `sip-names-dark.png`, `sip-names-light.png` (this folder)
**Used on:** `self-hosting/carriers-and-phones`
**Type:** diagram · flow (two rows)
**Preset:** 16:9 1600 × 900 (exported at 1×)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `y7Br8U` (dark), `ZW8QA` (light) (file: `designs/docs.pen`)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

## One message

Two wildcard records send every trunk and domain name under your domain to your machine.

## Sources (ground truth)

- `docs-site/self-hosting/carriers-and-phones.mdx`
- `mods/apiserver/src/envs.ts` (PSTN_ROOT, SIP_ROOT), `ops/bundle/config/fonoster.yaml`, `ops/bundle/init.sh` (the .env ports)

## Node / edge spec

```
Group CARRIERS · TRUNKS AT <LABEL>.PSTN.<DOMAIN>:
  Carrier (radio-tower) —[call to acme.pstn.example.com]→ DNS (network, *.pstn.example.com) → Fonoster (accent, server, SIP on port 5060) → Trunk Acme (cable)
Group PHONES · DOMAINS AT <LABEL>.SIP.<DOMAIN>:
  Softphone (headset) —[registers at acme.sip.example.com]→ DNS (*.sip.example.com) → Fonoster → Domain Acme (building-2)
Note: once a call connects, its audio uses UDP ports 10000 to 11999.
```

## Built from

Diagram/Node sEKX6, Diagram/Node Accent pifOQ, Diagram/Pill V8p0b, Diagram/Group np3qG, Diagram/Arrow R oSkeo.
Nodes are 250 wide; the first edge is 310 wide so the pill fits. Light = copy of dark with `theme: { "ui:mode": "light" }`.

## Re-export

`Export([y7Br8U, ZW8QA], "png", "docs-site/images/carriers-and-phones", { scale: 1 })`, then rename to `sip-names-dark.png` / `sip-names-light.png`.
