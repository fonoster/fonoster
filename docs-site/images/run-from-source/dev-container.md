# Dev container diagram

- **Source:** `designs/docs.pen`, frames "Docs / Hacking Fonoster / Dev container / Dark" (LQHpg) and
  "/ Light" (RVOSF). Light = copy of dark with `theme: { "ui:mode": "light" }`, fill `$ui:surface`; every
  color is a `$ui:` token.
- **Content:** three zones (your machine, the dev container, data). The workspace holds the components that run
  from source: apiserver, dashboard, fakes, appbridge, autopilot. The Roomr node is a dependency container
  (the bundle's pinned image) below it, between Routr, RTPEngine and appbridge. Accent edges = runs from your
  source; muted edges = containers you don't edit.
- **Export:** `Export([LQHpg, RVOSF], "png", <dir>, {scale: 1})` → `dev-container-dark.png` /
  `dev-container-light.png` (1602 × 902: the frame plus its 1px stroke on each side).
- **Animation:** `dev-container-{dark,light}.svg` embed the PNG and add dots that travel each connector
  (SMIL `animateMotion`, 60 px/s and at least 2 s per trip, one dot per flow). The dots are hidden under
  `prefers-reduced-motion: reduce`. The "your source" dot is hidden while it crosses its label.
  Rebuild after a new PNG export with the generator kept next to this note:
  `python3 gen_devcontainer_svg.py docs-site/images/run-from-source`. Connector coordinates are the
  centers of the 2px "Edge" bars in frame coordinates; re-read them from Pen if the layout moves.
