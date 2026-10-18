# Docs checkpoint — run-from-source

Started: 2026-10-16
Current stage: 7 — Wire (done, shipped)

**Purpose:** A contributor goes from a fresh clone of `main` to Fonoster running from source in the dev
container, signed in to the dashboard, with an agent answering a browser call. They leave knowing the one
command they run every day.

**Diátaxis type:** tutorial
**Reader:** contributors (Hacking Fonoster tab)

**Detected surfaces:** Mintlify: yes, `docs-site/` · Pencil: yes (`designs/docs.pen`) · OpenSpec: yes

**Placement:** new · `hacking/run-from-source` · nav group `Start` (Hacking Fonoster tab)

**Sources:**
- `.claude/docs/hacking-facts.md` (revamp-developer-experience report, DX-B1…B13)
- `.devcontainer/` (devcontainer.json, compose.yaml, initialize.sh, post-create.sh), root `package.json` dev:* scripts
- the owner's live run on a fresh clone (to be recorded below)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | approved with the outline |
| 1 | Source | done | facts file; live run fills outputs |
| 2 | Place | done | |
| 3 | Outline | done | approved, with banner |
| 4 | Assets | done | banner moved to hacking/overview; dev container diagram dark+light, animated SVG |
| 5 | Draft | done | from the owner's live run |
| 6 | Proof | done | labels checked in dashboard code; broken-links clean |
| 7 | Wire | done | Hacking Fonoster › Start, after Overview |

## Owner's live run

(record outputs, timings and friction here)

- 2026-10-16 · Step 1, clone: `git clone https://github.com/fonoster/fonoster.git ~/Projects/fonoster-dev` worked but took >120 s (full history: 6,640 commits, .git 276 MB, tree 361 MB). Friction: consider `--depth 1` or `--filter=blob:none` in the page. Host ports 8449, 5060, 6006 were free; no containers running; VS Code at /usr/local/bin/code.
- 2026-10-16 · Step 2, Reopen in Container (opened with `code ~/Projects/fonoster-dev`; the attached editor was Cursor — cursor-server in the workspace). All 8 services up within ~1-2 min (postgres, nats, minio, nats-test healthy); post-create (npm ci, build of 21 packages, go mod download, dev:config, Playwright Chromium) finished in roughly 8 min on first run. Friction: post-create dirties the clone — M mods/identity-client/proto/identity.proto, M mods/identity/src/generated/@prisma/client/{edge,index,wasm}.js, and untracked libquery_engine-linux-arm64-openssl-3.0.x.so.node (not gitignored). Container names are `fonoster-dev-<service>-1` (Compose project = folder name).
- 2026-10-16 · Step 3, `npm run dev` in the workspace terminal: owner reports "Everything is up". Running: apiserver, gateway, autopilot (tsx watch), roomr (.dev/bin/roomr), dashboard (vite --host 0.0.0.0), conformance fakes (mods/conformance/src/fakes/serve.ts). Dashboard http://localhost:8449 → 200.
- 2026-10-16 · Step 4, sign in: `npm run dev:info` in a second workspace terminal printed the owner sign-in; owner found it easily, signed in at http://localhost:8449 and landed in a default workspace.
- 2026-10-16 · Step 5, Talk to agent (New agent → template → Create agent → Talk to agent): the browser call CONNECTED (first real-browser verification of add-talk-in-browser in dev mode). Owner heard a beep: expected — FakeTts plays a tone whose length follows the text (MS_PER_CHAR); FakeLlm replies "Echo: <last user message>". The page must say this up front so the beep isn't read as a fault.
- Step 5 follow-up (call record /tmp/fonoster-records): FakeStt plays a scripted caller ("Hi, what are your opening hours?", "Great, thank you."), not the mic. Replies were cut at ~280 ms: real mic audio counts as barge-in. The talk drawer shows status only, no transcript (by design). BUG found: after an idle prompt, mic noise made an abandoned turn with no words; Autopilot sent it to the LLM ("Echo: ") and reset idleCount (Agent.ts respond), so the 3-strike idle hangup never fired — owner hung up after >60 s. Owner: fix now, small PR. Browser hangup finalized the record normally.
- Manual test of #929 (checkout of fix/autopilot-ignore-empty-turns inside the container): the dev runner restarted every component on checkout. Friction: Cursor auto-forwarded Autopilot's internal WebSocket port 3000 to the host and the owner landed on http://localhost:3000 → 426 Upgrade Required (blank). Fix idea: portsAttributes with onAutoForward: ignore for internal ports (3000 and the others the components open) in .devcontainer/devcontainer.json; page must say the dashboard is http://localhost:8449.
- Manual test result: on http://localhost:8449, a silent Talk-to-agent call now hangs up by itself after the idle prompts (owner: "This time it hangup"). #929 verified live.

## Decision log

- 2026-10-16 — Frame + outline approved in one gate, with a banner.
- 2026-10-16 — Owner: blobless clone; wait for the diagram before shipping; banner moves to the Overview; slower, fewer dots; ship and merge if green. Banner log lines stay illustrative for now (TODO in images/hacking/banner.md).
