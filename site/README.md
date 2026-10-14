# fonoster.com

The marketing site. Plain HTML + CSS + JS, deployed as-is to GitHub Pages by `.github/workflows/gh-pages.yml` (everything in `site/` except this README).

- Designs: `designs/website.pen` (frames: Home, Autopilot, Pricing — each Desktop + Mobile — plus 404 / Desktop, Share Image, Components)
- Pages: `index.html` (home), `autopilot/`, `pricing/`, `404.html` (absolute paths, since GitHub Pages serves it at any missing URL)
- Redirects: `v1/` → `/` (old preview links), `docs/` → docs.fonoster.com
- SEO: `sitemap.xml`, `robots.txt`, canonical + Open Graph tags (`assets/img/og.png`, from the "Share Image" frame in Pencil)
- Analytics: Google Analytics `G-49RD5H9MR3` in every page head (same property as the previous site)

## Preview locally

```sh
python3 -m http.server 8080 -d site
# open http://localhost:8080/
```

## Structure

| Path | What |
| --- | --- |
| `assets/css/v1.css` | Tokens (dark default, light via `data-theme`), layout, components, motion |
| `assets/js/v1.js` | Preferences, nav, reveals, and the animations listed below |
| `assets/js/i18n.js` | EN / ES strings (`data-i18n` keys) |
| `assets/js/notice.js` | The notice bar above the nav: on/off, EN / ES message, icon, link |
| `assets/img/icons.svg` | Lucide icon sprite (ISC) |

## Notice bar

The strip above the nav comes from `assets/js/notice.js`. To change it, edit `NOTICE` at the top of that file and merge to main; the Pages workflow redeploys on any change under `site/`.

- `show: false` hides it on every page.
- `en` / `es` hold the `lead`, `text`, and `cta`. In `text`, `[...]` is hidden on phones.
- `icon` is any `i-*` symbol in `assets/img/icons.svg`. Leave `link` empty for a bar without a call to action.
- Keep it to about one line on desktop.

Every page loads the file as the first thing in `<body>`, so the bar is drawn before the nav and nothing below it moves. Keep it that way when adding a page.

## Motion

Motion should make the product feel alive, never compete with the content. Rules:

1. **One ambient loop per screen at most.** Everything else plays once, or on hover.
2. **Only `transform`, `opacity`, and the light wave's mask position.**
3. **Pause what you can't see.** Loops stop offscreen and in background tabs.
4. **`prefers-reduced-motion: reduce`** turns off loops and reveals and shows the final state.
5. **Green stays reserved for CTAs.** Animated accents use white or a very faint tint.

Tokens: `--ease-out: cubic-bezier(.22,1,.36,1)`, `--ease-in-out: cubic-bezier(.65,0,.35,1)`, `--dur-1: 150ms` (hover), `--dur-2: 240ms` (UI), `--dur-3: 600ms` (reveals).

| # | Where | What | Trigger | Timing |
| --- | --- | --- | --- | --- |
| 1 | Hero (both pages), final CTA | A single soft line of light sweeps across the dot grid like a wave; at rest the background matches the design | Once 0.8s after load, then repeats; paused offscreen | Heroes: 4.5s sweep every 12s. Final CTA: 2.2s sweep every 10s |
| 2 | Home hero phone | Live call: timer ticks, captions stream word by word, the waveform moves while the agent talks, and the avatar ring pulses | Loop, paused offscreen | 70ms/word, 2.4s hold per line |
| 3 | Numbers row | Odometer roll of each digit | Once, on enter | 1.4s, 80ms stagger |
| 4 | Use cases | Messages and tool events appear in order; switching tabs cross-fades | On enter, on tab change | 450ms between items |
| 5 | Any model / Any carrier | A pulse travels Call → Hear → Think → Speak, lighting each step | Loop, paused offscreen | 6s cycle |
| 6 | Autopilot block | The terminal types the deploy command, then prints `Done!` | Once, on enter | 28ms/char |
| 7 | Autopilot hero console | The call plays out: bubbles and events appear, matching tools light up in the agent panel, timer runs | Once, on enter | 650ms per event |
| 8 | Autopilot bento | Barge-in bars, noise jitter, handoff dashes, document fan | Hover (desktop), once on enter | 1.2–2s |
| 9 | Evals terminal | Output prints line by line; `✔ Passed` pops | Once, on enter | 90ms/line |
| 10 | Section content | Fade up 12px, staggered | Once, on enter | 600ms, 60ms stagger |
| 11 | Buttons, cards, tabs, links | Lift 1–2px, brighten, arrow nudge | Hover / focus | 150ms |
| 12 | Nav | Background blur and divider fade in after scrolling | Scroll | 240ms |

## Open items

- **Notice bar.** The current message (major upgrades underway, contributions paused) is temporary. Set `show: false` in `assets/js/notice.js` once the refresh settles.
- "Start building" goes to the console login (app.fonoster.com/auth/login). "Contact sales" still uses the contact Typeform.
- "Call me" in the hero needs a backend that places the demo call (with rate limits and country restrictions). Until then the form shows a "coming soon" note; wire the real call in `initCallMe` in `v1.js`.
- The light theme and Spanish strings work but haven't been reviewed by design or a native speaker.
- **Legal pages.** There is no Privacy Policy or Terms yet (launched without them by decision). Needed before "Call me" collects phone numbers (consent for automated AI calls).
