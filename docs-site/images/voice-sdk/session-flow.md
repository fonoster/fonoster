# Asset build doc — session-flow

**Artifact:** `session-flow-dark.png`, `session-flow-light.png` (this folder)
**Used on:** `streams/voice-sdk`
**Type:** diagram · flow (left to right, with one two-way connector)
**Preset:** 16:9 1600 × 900 (exported at 1×, 1601 × 901 with stroke)
**Diagram Kit version:** v1 ("Docs / Diagram Kit", fdbKR)
**Pencil node id:** `bGBk2` (dark), `iwdRR` (light) (file: `designs/docs.pen`, at x 6800 y 4200 / 5200)

> Regenerate from this doc — do not edit the image. Change the spec or the kit, then re-export.

## One message

Fonoster opens one signed socket per call to your server; commands go out, events come back, and Fonoster does the speech.

## Sources (ground truth)

- `docs-site/streams/voice-sdk.mdx`: "What just happened".
- `.claude/docs/ASSET-QUEUE.md`: the queued spec.

## Node / edge spec

```
Caller (+1 809 555 0123 dials your number) → "phone call (audio)" (accent) → Fonoster (accent box, "does the speech",
  chips speech-to-text, text-to-speech)
Fonoster ⇄ Your WebSocket server (server.js · VoiceServer; note "Your code works with text, not audio…") through a tube
  labeled "one WebSocket per call, signed (x-fonoster-signature)":
  top muted ← "commands", chips above: say · gather · transfer · hangup
  bottom accent → "events", chips below: call started · speech heard ("support") · key pressed (0) · speech finished · call ended
Fonoster ⇣ dashed "transfer" → Operator (+1 809 555 0100)
Legend: accent = audio, and events to your code · muted = commands from your code · dashed = transfer to a person
```

## Built from (Diagram Kit v1)

| Component | id | Used for |
| :--- | :--- | :--- |
| Diagram/Node | sEKX6 | Caller, Operator |
| Diagram/Pill | V8p0b | edge labels |
| Diagram/Chip | PHmh8 | commands, events |
| Diagram/Arrow R / D | oSkeo / AdWAH | arrowheads |

Fonoster and server boxes and the tube are plain frames in the kit's style. Light = copy of dark with the theme switched.

## Re-export

```
Export(["bGBk2", "iwdRR"], "png", "docs-site/images/voice-sdk", {scale: 1})
```
Then rename to `session-flow-dark.png` / `session-flow-light.png`.
