# Introduction banner

- **Source:** `designs/docs.pen`, frames "Docs / Introduction / Banner / Dark" (FfKOU) and "/ Light" (ZTAsS),
  at x 5100. Copy of the Hacking banner (JbV94 / bmkIB) with new text; the terminal is replaced by a call card.
  Light = copy of the light Hacking banner (`theme: { "ui:mode": "light" }`, fill `$ui:surface`); every color is a `$ui:` token.
- **Content:** eyebrow "FONOSTER", headline "The AI that answers the phone.", subhead "Build, test and run voice
  agents on real phone lines." Call card: incoming number +1 (555) 010-4477 "Answered by Front desk", a live
  timer 00:12, and three transcript bubbles (agent lines outlined in accent, caller line plain).
- **Note:** the number and the dialogue are illustrative (555-01xx is a fictional range).
- **Export:** `Export([FfKOU, ZTAsS], "png", docs-site/images/introduction, {scale: 1})`, rename to
  `banner-dark.png` / `banner-light.png` (1602 × 602: the frame plus its stroke).
