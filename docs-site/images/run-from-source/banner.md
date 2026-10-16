# Hacking Fonoster banner

- **Source:** `designs/docs.pen`, frames "Docs / Hacking Fonoster / Banner / Dark" (JbV94) and "/ Light" (bmkIB),
  at x 3400. Copy of the Self-hosting banner (XzPmi) with new text and terminal; light = copy of dark with
  `theme: { "ui:mode": "light" }`, fill `$ui:surface`.
- **Content:** eyebrow "HACKING FONOSTER", headline "Fonoster, from source.", subhead "Open the dev container.
  Every component reloads as you save.", terminal `npm run dev` with prefixed log lines.
- **TODO:** the log lines are illustrative; replace them with the real `npm run dev` output from the owner's run.
- **Export:** `Export([JbV94, bmkIB], "png", docs-site/images/run-from-source, {scale: 1})`, rename to
  `banner-dark.png` / `banner-light.png`.
