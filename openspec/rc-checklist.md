# Release-candidate checklist

Manual checks, measurements and rollout steps moved out of archived changes on 2026-10-17. They
are not code, so they run against a release candidate (roadmap phase 6). The source task is in
the archived change named in brackets.

Status as of 2026-10-18 (chore/rc-prep): items an agent could run on the owner's Mac are ticked
with their evidence. Every open item has an **Owner:** note with what to do and about how long.

## Before the release candidate (found during the 2026-10-18 prep, not fixed: they widen NATS permissions or need a decision)

- [ ] NATS permissions block TrackCall. The API server subscribes to `calls.*.events`
  (`mods/apiserver/src/calls/createTrackCall.ts:143`) and publishes there
  (`outbound/runOutboundCalls.ts:57`); the media node publishes there too
  (`go/roomr/internal/node/node.go:408`). Neither `apiserver.conf` nor `roomr.conf` in
  `ops/bundle/config/nats-permissions` (and the `ops/rebuild` and Helm copies) allows it. A fresh
  bundle install logs `PERMISSIONS_VIOLATION ... subscription calls.*.events` at apiserver start, so
  outbound-call status tracking gets no events. Inbound calls are not affected (the e2e call
  below passed). **Owner:** decide whether to allow it (add `calls.*.events` to the API server's
  publish and subscribe and to the media node's publish), or scope it more tightly; ~15 min plus
  an outbound-call test.
- [ ] The `aiCoustics` audio filter cannot run from the gateway image: `@ai-coustics/aic-sdk` is a
  dependency of `mods/apiserver` only, and `/work/node_modules/@ai-coustics` is missing from
  `fonoster/appbridge` (checked on the 0.30.0-rcprep build). Every app that turns it on gets
  unfiltered audio and a `filter.failed` event. See `docs/operators/audio-filters.md`.
  **Owner:** fix it before the release or hide the filter in the dashboard catalog
  (`mods/dashboard/src/agents/catalog.ts`); a decision, then ~1-2 h.

## Install

- [ ] Clean-folder install from the bundle on macOS through to a softphone call: `init`, `check`, `docker compose up -d`, sign in, add a provider key, create an Autopilot app, call it (add-self-host-installer 5.1)
  - Done by an agent on 2026-10-18 (macOS 26.3, arm64, Docker 29.8.2, Compose v5.6.0) with the
    bundle and images built from this branch (`ops/release/bundle 0.30.0-rcprep`, local tags; no
    0.30 images, archive or `@fonoster/common` are published yet). It followed
    `docs-site/self-hosting/install-compose.mdx` step by step in an empty folder, with the local
    archive and `.tgz` instead of the release URL and `npx -p @fonoster/common`, and moved every
    port with the page's own Tip (edit `.env`, run `init` again). `init` 5 s, `check` all valid,
    `up -d` to a healthy apiserver 13 s, all 11 services `Up`, the dashboard answered 200, and
    `info` printed the login. Sign-in was through the API (SDK `login` with the owner), not a
    browser. With no vendor keys it added the fake providers as a test-only overlay (`testMode`,
    fake Deepgram and OpenAI), created a workspace, a trunk, an Autopilot agent and a number with
    `ops/rebuild/seed.cjs`, and called it with the SIP caller bot (`ops/rebuild/e2e.cjs`). The
    greeting was heard (3.8 s of audio), the reply came 637 ms after the caller's turn, the
    hang-up was clean, and the call record was sealed and verified. From unpacking to the
    verified call took 3.5 min with images cached. Image sizes on disk add up to 5.0 GB (arm64,
    uncompressed); the page's "about 6 GB" holds. The pull wasn't timed because every image was
    already cached.
  - Doc errors fixed in `install-compose.mdx`: `init`'s output (10 secrets, not 11; 3 key files,
    not 10; `roomr.yaml` was missing from the list; the `Then:` line), `info`'s `Files`
    block, and `compose.tls.yaml` and the schemas in the folder list. A Tip for a second install
    on the same machine (project name and subnet) was added. Also fixed: the
    `fonoster-config init --regions` comment in `ops/bundle/config/fonoster.example.yaml` (no
    such flag).
  - Friction left: the "Make your first call" card has no page yet (`self-hosting/first-call`,
    MENU ★), so nothing tells a reader how to add a key, create an agent and register a
    softphone. The download URL and `npx -p @fonoster/common` work only after the first release.
  - **Owner:** after the first release, repeat it with a real softphone (Zoiper or Linphone), a
    real vendor key in the dashboard, and the published archive and images: read the page, run
    it, and time the image pull. ~30-45 min.
- [ ] The same install on a Linux host (add-self-host-installer 5.2)
  - **Owner:** on a fresh Ubuntu 24.04 VM (2 vCPU, 8 GB, public or LAN IP) with Docker Engine
    and Node 22, follow `install-compose.mdx` word for word through `info` and a dashboard
    sign-in, then call it from a softphone. Note `rtpengine`'s `network_mode: host` comment and
    whether `init` detects the right address. ~45 min (plus the release, for the published
    images).
- [x] `docker compose up` with the example files: apiserver and Autopilot start with no `APISERVER_*` / `AUTOPILOT_*` variables (unified-service-config 7.3)
  - 2026-10-18, project `rcprep-install`, images built from this branch: `init` + `check` (all
    valid), then `up -d`. All 11 services ran, apiserver was healthy and the dashboard returned
    200. `docker inspect` of both containers shows one `AUTOPILOT_*` name: `AUTOPILOT_SIGNING_SECRET`.
    It is a secret the YAML references as `${AUTOPILOT_SIGNING_SECRET}`
    (`fonoster.example.yaml:28`, `autopilot.example.yaml:6`), not a config variable. There were
    no `APISERVER_*` names. Torn down with `down -v`.
- [ ] Dashboard live check against the local stack, Community (password) and Cloud (email code; GitHub with a real OAuth app) (dashboard-tailwind-migration 6.3)
  - **Owner:** after the dashboard-auth change lands, run `ops/rebuild/stack up`. Sign in with a
    password (Community). Then sign in with an email code, with mail going to the dev mail
    catcher. Then sign in with GitHub, using a real OAuth app with callback
    pointing at the local dashboard; its client id and secret go in the API server's config
    (`fonoster.yaml`). Click through each section once. ~45 min, plus ~10 min to create the
    GitHub OAuth app.

## Calls and audio

- [ ] Record real caller audio for the call-record fixtures, including a spoken card number and a handoff (add-call-record 1.2)
  - **Owner:** record 3-5 short calls (16 kHz mono WAV) against the local stack with a real
    phone: one reads out a test card number (4242 4242 4242 4242), one asks for a person. Drop
    them in the fixtures folder named by add-call-record. Get consent from anyone else who
    speaks. ~1 h.
- [ ] Build the turn-taking replay corpus from consented recorded calls (add-turn-taking 1.5)
  - **Owner:** collect 20-50 consented real calls with varied pauses, barge-ins and
    backchannels (mixed English and Spanish), label the end-of-turn points, and commit them
    where add-turn-taking's replay harness reads them. ~half a day.
- [ ] Verify the baseline turn detector against recorded calls (add-turn-taking 2.2)
  - **Owner:** after the corpus exists, run the replay harness and compare early cut-offs and
    late replies against the thresholds in the change. ~1 h.
- [ ] Validate answering-machine thresholds against real Spanish-language carrier voicemail (asterisk-answering-machine-detection 5.7)
  - **Owner:** place 10+ outbound calls to Spanish-language voicemail boxes on real carriers
    (Claro, Altice and Viva in DR; Movistar), and 10+ answered by people. Record the AMD result
    for each and tune the thresholds if you get false "human" or "machine" results. ~2 h, and a
    trunk with outbound minutes.

## Audio filters (now configured on the gateway)

- [ ] Bake the noise-filter model into the image and turn off `autoDownload` in production (voice-audio-filters 5.2)
  - Assessed on 2026-10-18; not a small change, so it wasn't made. First the SDK has to reach
    the gateway (see "Before the release candidate"). Then the gateway needs operator config
    for the license, `modelDir` and `autoDownload` (today apps can set only `model`,
    `enhancementLevel` and `bypass`), and `/work/models` isn't writable by the runtime user. The
    v7 model (`quail_vf_2_2_s_16khz_gf70x7zf_v14.aicmodel`, sha256 `59a57bae…6614`, 5.3 MB)
    downloads without a key, so a pinned, checksummed build step is easy. But the ai-coustics
    Model License allows bundling only under an agreement, which a public MIT image on Docker
    Hub probably doesn't have. The plan is in `docs/operators/audio-filters.md`.
  - **Owner:** decide whether to get an agreement with ai-coustics to redistribute the model,
    or have operators mount it read-only. Then do the plan: ~half a day.
- [x] Operations note: added delay, CPU per call, the vendor's license check, glibc-only binaries (voice-audio-filters 6.3)
  - `docs/operators/audio-filters.md`. Delay: a 15 ms block plus the gateway's 15 ms priming,
    and the model's own delay needs a key to measure. CPU: unmeasured; the design estimated about
    1 ms per 20 ms frame. License: online check to `api.ai-coustics.io`, fail-open to
    unfiltered audio, offline needs a special license. Binaries: glibc only (`linux-x64-gnu` and
    `linux-arm64-gnu`); the gateway's `node:22-slim` image has glibc 2.36.
- [ ] Measure on real call recordings: word error rate, background leakage, latency (voice-audio-filters 7.1)
  - **Owner:** needs an ai-coustics license key and the SDK fix above. Then replay the recorded
    calls (above) with and without the filter, and compare STT word error rate, leaked
    background speech and `delaySamples` from the verbose log. ~2 h.
- [ ] Load test one instance for calls per core and `UV_THREADPOOL_SIZE` (voice-audio-filters 7.2)
  - **Owner:** after the fix and a key, run the load suite with the filter on at 1, 4 and 8
    `UV_THREADPOOL_SIZE`, and note calls per core before frames drop. ~2 h on a 4-8 core Linux
    host.
- [ ] Enable for one application against a control, then widen (voice-audio-filters 7.3)
  - **Owner:** a production rollout after 7.1 and 7.2: turn it on for one app, compare a week of
    its call outcomes and STT confidence with a similar app, then widen. ~1 week elapsed, ~1 h
    of work.

## Load and runners (owner-deferred, needs budget)

- [ ] Pick a runner for the nightly end-to-end and load suites: (a) a GitHub larger-runner group (e.g. 16-core Linux), (b) a self-hosted runner labelled `conformance`, or (c) stay on ubuntu-latest with T2 report-only; then set the repository variable `LOAD_RUNNER` to turn on `load-full` in conformance.yaml (harden-conformance 2.4)
  - **Owner:** a budget decision. For (a), create the runner group in the org settings (Actions →
    Runners; check GitHub's per-minute price for the size you pick). For (b), register a
    host with the `conformance` label. Then set `LOAD_RUNNER` under Settings → Variables. ~15 min
    once decided.
- [ ] T2 at full scale: ten gateway replicas at 1,000 calls with zero dropped frames (`scale.ts --replicas 10`, about 20 vCPU for the gateways plus a separate load generator). Today the nightly 2 × 200 profile is report-only and locally 1 × 100 delivered 99% of frames (harden-conformance 2.2)
  - **Owner:** after the runner decision, run `scale.ts --replicas 10` on the chosen hardware
    (or one ~32 vCPU cloud VM for an hour) and record dropped frames. ~2 h.

## Release and docs

- [ ] First release run after the owner re-enables `release.yaml` (revamp-ci-workflows 4.4)
  - **Owner:** re-enable `release.yaml` (Actions → the workflow → Enable) and make sure the npm
    and Docker Hub secrets are set. Run it for 0.30.0, then check that the archive URL in
    `install-compose.mdx` resolves, that `npx -p @fonoster/common fonoster-config --help` works,
    and that `fonoster/{apiserver,gateway,autopilot,roomr,dashboard}:0.30.0` exist (gateway
    and roomr have never been published). ~1 h with watching.
- [x] How-tos for ClickHouse, telemetry and hosting private regions (listed in `docs-site/MENU.md`, pages missing) (unify-config-placeholders 5.2)
  - `docs-site/self-hosting/send-call-metrics-to-clickhouse.mdx`,
    `docs-site/self-hosting/send-telemetry.mdx` and
    `docs-site/private-regions/host-private-regions.mdx`, all in `docs.json`. They're written
    from the config schemas. Their edited configs pass `init` and `check` and the services'
    schemas, `analytics rebuild` was run against a fake ClickHouse, and the hub setup script
    was run. Not run in live containers: the hub with a real certificate, and the collector's
    output. Gaps found: Autopilot sends no telemetry of its own; `OTEL_EXPORTER_OTLP_HEADERS`
    isn't passed by `compose.yaml`; there's no `fonoster-config` command for the region hub.
    **Owner:** read the three pages, ~20 min.
