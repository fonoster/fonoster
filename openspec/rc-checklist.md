# Release-candidate checklist

Manual checks, measurements and rollout steps moved out of archived changes on 2026-10-17. They
are not code, so they run against a release candidate (roadmap phase 6). The source task is in
the archived change named in brackets.

## Install

- [ ] Clean-folder install from the bundle on macOS through to a softphone call: `init`, `check`, `docker compose up -d`, sign in, add a provider key, create an Autopilot app, call it (add-self-host-installer 5.1)
- [ ] The same install on a Linux host (add-self-host-installer 5.2)
- [ ] `docker compose up` with the example files: apiserver and Autopilot start with no `APISERVER_*` / `AUTOPILOT_*` variables (unified-service-config 7.3)
- [ ] Dashboard live check against the local stack, Community (password) and Cloud (email code; GitHub with a real OAuth app) (dashboard-tailwind-migration 6.3)

## Calls and audio

- [ ] Record real caller audio for the call-record fixtures, including a spoken card number and a handoff (add-call-record 1.2)
- [ ] Build the turn-taking replay corpus from consented recorded calls (add-turn-taking 1.5)
- [ ] Verify the baseline turn detector against recorded calls (add-turn-taking 2.2)
- [ ] Validate answering-machine thresholds against real Spanish-language carrier voicemail (asterisk-answering-machine-detection 5.7)

## Audio filters (now configured on the gateway)

- [ ] Bake the noise-filter model into the image and turn off `autoDownload` in production (voice-audio-filters 5.2)
- [ ] Operations note: added delay, CPU per call, the vendor's license check, glibc-only binaries (voice-audio-filters 6.3)
- [ ] Measure on real call recordings: word error rate, background leakage, latency (voice-audio-filters 7.1)
- [ ] Load test one instance for calls per core and `UV_THREADPOOL_SIZE` (voice-audio-filters 7.2)
- [ ] Enable for one application against a control, then widen (voice-audio-filters 7.3)

## Release and docs

- [ ] First release run after the owner re-enables `release.yaml` (revamp-ci-workflows 4.4)
- [ ] How-tos for ClickHouse, telemetry and hosting private regions (listed in `docs-site/MENU.md`, pages missing) (unify-config-placeholders 5.2)
