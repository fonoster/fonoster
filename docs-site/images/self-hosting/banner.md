# Self-hosting banner

- **Source:** `designs/docs.pen`, frames "Docs / Self-hosting / Banner / Dark" (XzPmi) and "/ Light" (xB0Kp).
  The light frame is a copy of the dark one with `theme: { "ui:mode": "light" }`; edit the dark one and re-copy.
- **Tokens:** only `ui` library variables (`$ui:bg`, `$ui:surface-sunken`, `$ui:border`, `$ui:text-*`,
  `$ui:accent` for the check icon only, fonts `$ui:--font-secondary` Poppins / `$ui:--font-primary` Roboto Mono).
  Card: dark `$ui:surface-raised`, light `$ui:surface`, 2 px `$ui:border`, radius 24, so it stands out from the page. Dot texture `designs/assets/pattern-hero.png` (shows in dark).
- **Content:** eyebrow "SELF-HOSTING", headline "Fonoster on your own servers.", subhead
  "From download to dashboard in three commands.", terminal with the three install commands from
  `self-hosting/install-compose` and the `info` dashboard line (example address 192.0.2.10).
  Keep the commands in sync with that page.
- **Export:** `Export([XzPmi, xB0Kp], "png", docs-site/images/self-hosting, {scale: 1})`, then rename to
  `banner-dark.png` / `banner-light.png`.
