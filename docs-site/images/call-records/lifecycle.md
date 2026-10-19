# Asset build doc — lifecycle

**Artifact:** `lifecycle-dark.png`, `lifecycle-light.png` (this folder)
**Used on:** `observe/call-records`
**Type:** diagram · flow with a boundary (left to right, fork and merge)
**Preset:** 16:9 1600 × 900 (exported at 1×, 1601 × 901 with stroke)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `h7Nx8I` (dark), `G5kaw` (light) (file: `designs/docs.pen`, at x 8500 y 4200 / 5200)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

## One message

Every version exists as two signed copies, and you can check either one against the region's published keys.

## Sources (ground truth)

- `docs-site/observe/call-records.mdx`: versions, two copies, how a record is signed.
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
Group "REGION" (x 48–1188):
  Call ends → "hangup" → Record sealed (version 1 · vCon); note "a change seals version 2, 3… pointing to the previous one"
  fork → Original (transcript, messages.ndjson, recording; badge "owners and admins")
       → Redacted (card numbers → [card number], recording beeped; badge "default")
  merge → Signed (Node Accent, ES256 JWS, region key kid)
  Published keys (/.well-known/call-record-keys.json, current + earlier keys)
Outside: Signed → Your webhook endpoint (receives call_record.sealed) and SDK · CLI · HTTP (GET /api/records/<callRef>)
  SDK ⇣ dashed "either copy" → Verify; Published keys → Verify (muted)
Legend: accent = the record, from hangup to you · muted = checking a copy
```

## Built from (Diagram Kit v1)

| Component | id | Used for |
| :--- | :--- | :--- |
| Diagram/Group | np3qG | Region |
| Diagram/Node | sEKX6 | every node except Signed |
| Diagram/Node Accent | pifOQ | Signed |
| Diagram/Pill | V8p0b | hangup, either copy |
| Diagram/Arrow R / D | oSkeo / AdWAH | arrowheads |

Badges are plain pill frames with an icon. Light = copy of dark with the theme switched.

## Re-export

```
Export(["h7Nx8I", "G5kaw"], "png", "docs-site/images/call-records", {scale: 1})
```
Then rename to `lifecycle-dark.png` / `lifecycle-light.png`.
