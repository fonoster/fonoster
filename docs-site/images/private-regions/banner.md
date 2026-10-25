# Private regions banner

- **Source:** `designs/docs.pen`, frames "Docs / Private regions / Banner / Dark" (LhHSm) and "/ Light" (Izuou).
  Copy of the Hacking banner with new text and terminal; light = copy of dark with
  `theme: { "ui:mode": "light" }`, fill `$ui:surface`.
- **Content:** eyebrow "PRIVATE REGIONS", headline "Your calls, on your servers.", subhead "Run a region on your
  own machines. Calls and keys never leave.", terminal with the cell install commands from `ops/rebuild/cell/compose.yaml`
  (copy the env file, `enroll <token>`, `up -d`). Keep in sync with the region setup page when it is written.
- **Export:** `Export([LhHSm, Izuou], "png", docs-site/images/private-regions, {scale: 1})`, rename to
  `banner-dark.png` / `banner-light.png`.
