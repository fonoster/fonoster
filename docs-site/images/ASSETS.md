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

## Diagram Kit

`designs/docs.pen` → "Docs / Diagram Kit" (fdbKR), v1. Reusable components, all colored with `$ui:` tokens
(the diagram frame's `ui:mode` theme picks light or dark): Diagram/Node (sEKX6), Diagram/Node Accent (pifOQ),
Diagram/Pill (V8p0b), Diagram/Chip (PHmh8), Diagram/Arrow R (oSkeo), Diagram/Arrow D (AdWAH),
Diagram/Group (np3qG). Edges are 2px rectangles: `$ui:accent` for the main path, `$ui:text-muted` for the rest.
