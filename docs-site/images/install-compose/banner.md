# Install with Docker Compose banner

- **Source:** `designs/docs.pen`, frames "Docs / Install with Docker Compose / Banner / Dark" (zetxQ) and
  "/ Light" (ibh1W), placed in the column right of the Self-hosting banner (x 1700). The dark frame is a copy of
  the Self-hosting banner (XzPmi) with new text and terminal; the light frame is a copy of the dark one with
  `theme: { "ui:mode": "light" }` and fill `$ui:surface`. Edit the dark one and re-copy.
- **Content:** eyebrow "DOCKER COMPOSE", headline "One machine. Every service.", subhead "The voice path, the API,
  the dashboard and Autopilot, started with one command.", terminal `docker compose ps` with the 11 default
  services (status dot `$ui:accent`, "Up"). Keep the list in sync with `ops/bundle/compose.yaml`.
- **Export:** `Export([zetxQ, ibh1W], "png", docs-site/images/install-compose, {scale: 1})`, then rename to
  `banner-dark.png` / `banner-light.png`.
