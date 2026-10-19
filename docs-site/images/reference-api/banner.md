# Asset build doc — banner

**Artifact:** `banner-dark.png`, `banner-light.png` (this folder)
**Used on:** `reference/api`
**Type:** banner (copy of the Telephony banner pair YSUfF / iZH90, flow panel replaced)
**Preset:** wide 1600 × 600 (exported at 1×)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `iVtdo` (dark), `Wg51M` (light) (file: `designs/docs.pen`)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.



## One message

gRPC, grpc-web and a few HTTP routes share one address, and the SDK covers them all.

## Sources (ground truth)

- `docs-site/reference/api.mdx`
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
Copy: REFERENCE / API / One endpoint. Use the SDK.
Flow panel: Node SDK · gRPC (Node Accent), Browser · grpc-web, HTTP · /api/records · /api/regions → bus → api.fonoster.com (or your install's address)
```

## Built from

Diagram/Node sEKX6, Diagram/Node Accent pifOQ, Diagram/Arrow R oSkeo.

Edges are 2px rectangles (`$ui:accent` for the main path, `$ui:text-muted` for the rest). Colors are `$ui:` tokens;
light = copy of dark with `theme: { "ui:mode": "light" }`.

## Re-export

```
Export(["iVtdo", "Wg51M"], "png", "<dir>", {scale: 1})
```
Then rename to `banner-dark.png` / `banner-light.png`.
