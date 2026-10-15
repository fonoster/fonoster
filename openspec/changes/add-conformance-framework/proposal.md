## Why

The rebuild replaces most of the call path: a new session protocol, a gateway, a provider
registry, a call record, new SDKs and a reworked Autopilot. Without a way to prove each part does
what its spec says, "architecture done" means nothing and any rewrite, in any language, is a leap
of faith. Every contract therefore gets an executable proof before anything is built.

## What Changes

- **One validation model for every contract.** Each contract gets a fake for each side, a
  conformance suite that talks only through the public contract (WebSocket messages, registry
  commands, vCon files) and a pass bar. An implementation in another language must pass the same
  suite unchanged.
- **"Architecture done" is defined.** A domain is done when its OpenSpec change is approved and its
  conformance suite is specified. Building stays deferred until the owner approves it.
- **Language-neutral scenario files** (format proposed here) drive both the TypeScript and Python
  SDK suites, so both SDKs run the exact same cases.
- **Suites per domain:** session protocol, SDKs, Twilio flavor, gateway timing, turn-taking
  replay, Autopilot, provider adapters, registry utility, call record, scale, and end to end.
- **Pass bars T1–T4:** gateway latency, scale, the turn-taking corpus and live provider tests.
- **Where they run:** fake-based suites on every pull request; end-to-end and load tests nightly;
  live provider tests on demand only.

## Capabilities

### New Capabilities

- `conformance`: the fakes, conformance suites, scenario files, pass bars and CI cadence used to
  prove every rebuild contract (`voice-session`, `twilio-media-streams-flavor`, `turn-taking`,
  `provider-registry`, `call-record`, `voice-sdk`, `autopilot`).

### Modified Capabilities

None.

## Impact

- **Affected code (when built):** a new workspace package, `mods/conformance`, holding the test harness with fakes (app, gateway, media node,
  providers, caller bot), scenario files, and CI workflows. No production code changes.
- **Depends on:** every other rebuild change; its scenarios are the cases these suites execute.
- **CI cost:** nightly end-to-end and load runs need dedicated runners; live provider tests spend
  vendor credits only when run by hand.
