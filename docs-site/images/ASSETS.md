# Docs assets

Every image under `docs-site/images/` (except `legacy/`) is drawn in `designs/docs.pen` and exported here.
One row per asset.

| Asset | Page | Pencil frame | Size | Notes |
| ----- | ---- | ------------ | ---- | ----- |
| `self-hosting/banner-dark.png`, `banner-light.png` | `self-hosting/overview` | `designs/docs.pen` → "Docs / Self-hosting / Banner / Dark" (XzPmi), "… / Light" (xB0Kp) | 1600 × 600 (wide-flow preset, exported at 1×) | Build note: `images/self-hosting/banner.md` |
| `install-compose/banner-dark.png`, `banner-light.png` | `self-hosting/install-compose` | `designs/docs.pen` → "Docs / Install with Docker Compose / Banner / Dark" (zetxQ), "… / Light" (ibh1W) | 1600 × 600 (wide-flow preset, exported at 1×) | Build note: `images/install-compose/banner.md` |
| `hacking/banner-dark.png`, `banner-light.png` | `hacking/overview` | `designs/docs.pen` → "Docs / Hacking Fonoster / Banner / Dark" (JbV94), "… / Light" (bmkIB) | 1600 × 600 (wide-flow preset, exported at 1×) | Build note: `images/hacking/banner.md` |
| `run-from-source/dev-container-dark.svg`, `dev-container-light.svg` (+ `.png`) | `hacking/run-from-source` | `designs/docs.pen` → "Docs / Hacking Fonoster / Dev container / Dark" (LQHpg), "… / Light" (rbl5D) | 1600 × 900 (exported at 1×, 1602 × 902 with stroke) | Animated SVG over the PNG; build note: `images/run-from-source/dev-container.md` |
| `introduction/banner-dark.png`, `banner-light.png` | `introduction` | `designs/docs.pen` → "Docs / Introduction / Banner / Dark" (FfKOU), "… / Light" (ZTAsS) | 1600 × 600 (wide-flow preset, exported at 1×) | Build note: `images/introduction/banner.md` |
| `how-fonoster-works/banner-dark.png`, `banner-light.png` | `concepts/how-fonoster-works` | `designs/docs.pen` → "Docs / How Fonoster works / Banner / Dark" (XdHCv), "… / Light" (viDXY) | 1600 × 600 (wide-flow preset, exported at 1×) | Build note: `images/how-fonoster-works/banner.md` |
| `how-fonoster-works/call-path-dark.png`, `call-path-light.png` | `concepts/how-fonoster-works` | `designs/docs.pen` → "Docs / How Fonoster works / Call path / Dark" (qOjTY), "… / Light" (Xj5vj) | 1600 × 900 (16:9 preset, exported at 1×) | Diagram Kit v1; build note: `images/how-fonoster-works/call-path.md` |
| `turn-taking/banner-dark.png`, `banner-light.png` | `autopilot/turn-taking` | `designs/docs.pen` → "Docs / Turn-taking / Banner / Dark" (qpDc4), "… / Light" (D9U7uE) | 1600 × 600 (wide-flow preset, exported at 1×) | Build note: `images/turn-taking/banner.md` |
| `turn-taking/timeline-dark.png`, `timeline-light.png` | `autopilot/turn-taking` | `designs/docs.pen` → "Docs / Turn-taking / Timeline / Dark" (SsXUR), "… / Light" (EyUjx) | 1600 × 900 (16:9 preset, exported at 1×) | Diagram Kit v1; build note: `images/turn-taking/timeline.md` |
| `knowledge-base/lookup-dark.png`, `lookup-light.png` | `autopilot/knowledge-base` | `designs/docs.pen` → "Docs / Knowledge base / Lookup / Dark" (DkAff), "… / Light" (In0cE) | 1600 × 900 (16:9 preset, exported at 1×) | Diagram Kit v1; build note: `images/knowledge-base/lookup.md` |
| `telephony/banner-dark.png`, `banner-light.png` | `telephony/numbers` | `designs/docs.pen` → "Docs / Telephony / Banner / Dark" (YSUfF), "… / Light" (iZH90) | 1600 × 600 (wide-flow preset, exported at 1×) | Build note: `images/telephony/banner.md` |
| `numbers/routing-dark.png`, `routing-light.png` | `telephony/numbers` | `designs/docs.pen` → "Docs / Numbers / Routing / Dark" (kEITB), "… / Light" (C2SbKU) | 1600 × 900 (16:9 preset, exported at 1×) | Diagram Kit v1; build note: `images/numbers/routing.md` |
| `trunks/inbound-outbound-dark.png`, `inbound-outbound-light.png` | `telephony/trunks` | `designs/docs.pen` → "Docs / Trunks / Inbound and outbound / Dark" (Kay48), "… / Light" (OMdZt) | 1600 × 900 (16:9 preset, exported at 1×) | Diagram Kit v1; build note: `images/trunks/inbound-outbound.md` |
| `link-twilio/what-it-creates-dark.png`, `what-it-creates-light.png` | `telephony/link-twilio` | `designs/docs.pen` → "Docs / Link Twilio / What it creates / Dark" (XzrCr), "… / Light" (kGxLQ) | 1600 × 900 (16:9 preset, exported at 1×) | Diagram Kit v1; build note: `images/link-twilio/what-it-creates.md` |
| `transfers/modes-dark.png`, `modes-light.png` | `telephony/transfers` | `designs/docs.pen` → "Docs / Transfers / Modes / Dark" (UKjCd), "… / Light" (xMrG7) | 1600 × 900 (16:9 preset, exported at 1×) | Diagram Kit v1; build note: `images/transfers/modes.md` |
| `voice-sdk/session-flow-dark.png`, `session-flow-light.png` | `streams/voice-sdk` | `designs/docs.pen` → "Docs / Voice SDK / Session flow / Dark" (bGBk2), "… / Light" (iwdRR) | 1600 × 900 (16:9 preset, exported at 1×) | Diagram Kit v1; build note: `images/voice-sdk/session-flow.md` |
| `call-records/lifecycle-dark.png`, `lifecycle-light.png` | `observe/call-records` | `designs/docs.pen` → "Docs / Call records / Lifecycle / Dark" (h7Nx8I), "… / Light" (G5kaw) | 1600 × 900 (16:9 preset, exported at 1×) | Diagram Kit v1; build note: `images/call-records/lifecycle.md` |

## Diagram Kit

`designs/docs.pen` → "Docs / Diagram Kit" (fdbKR), v1. Reusable components, all colored with `$ui:` tokens
(the diagram frame's `ui:mode` theme picks light or dark): Diagram/Node (sEKX6), Diagram/Node Accent (pifOQ),
Diagram/Pill (V8p0b), Diagram/Chip (PHmh8), Diagram/Arrow R (oSkeo), Diagram/Arrow D (AdWAH),
Diagram/Group (np3qG). Edges are 2px rectangles: `$ui:accent` for the main path, `$ui:text-muted` for the rest.
