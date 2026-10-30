# Private regions banner

- **Source:** `designs/docs.pen`, frames "Docs / Private regions / Banner / Dark" (LhHSm) and "/ Light" (Izuou).
  Copy of the Hacking banner with new text and terminal; light = copy of dark with
  `theme: { "ui:mode": "light" }`, fill `$ui:surface`.
- **Content:** eyebrow "PRIVATE REGIONS", headline "Your calls, on your servers.", subhead "Run a region on your
  own machines. Calls and keys never leave.", terminal with the region install commands (the current PNG still shows the old
  install: copy the env file, `enroll <token>`, `up -d`). On the next re-export, show the playbook
  from [Install a private region](../../private-regions/install-region.mdx): `ansible-playbook -i
  inventory/region.yml playbooks/region.yml`. Keep in sync with that page.
- **Export:** `Export([LhHSm, Izuou], "png", docs-site/images/private-regions, {scale: 1})`, rename to
  `banner-dark.png` / `banner-light.png`.
