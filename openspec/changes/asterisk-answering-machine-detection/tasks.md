# Tasks

## 1. Media server

- [x] 1.1 Add `AMD()` to `[local-ctx-common]` in `asterisk/config/extensions.conf`, gated on
      `AMD_ENABLED` and jumping to a named `(stasis)` label
- [x] 1.2 Add `asterisk/config/amd.conf` with the thresholds
- [x] 1.3 Confirm `app_amd.so` ships in the Alpine `asterisk` package
- [x] 1.4 Confirm the dialplan compiles with the existing numeric jump targets intact

## 2. Contract

- [x] 2.1 Add the `Amd` message and `CreateSessionRequest.amd = 12` to `voice.proto`, matching
      PR #889
- [x] 2.2 Add the `AmdStatus` enum, `Amd` type, and `VoiceClientConfig.amd?` to `mods/common`
- [x] 2.3 Re-export `Amd` / `AmdStatus` from `@fonoster/voice`

## 3. API server

- [x] 3.1 Add `AMD_STATUS` / `AMD_CAUSE` to `ChannelVar`
- [x] 3.2 Add `mapAsteriskAmd` — `AMDSTATUS` to the `Amd` verdict
- [x] 3.3 Read the verdict in `createCreateVoiceClient` and attach it to the session config
- [x] 3.4 Set `AMD_ENABLED` at originate in `runCallManager` when the env is on
- [x] 3.5 Add the `APISERVER_AMD_ENABLED` env and wire it through `compose.yaml` and the
      `.env.example` files

## 4. CDR

- [x] 4.1 Add `amdResultCache`, keyed by `callRef`, carrying `AMDCAUSE`
- [x] 4.2 Fold the verdict onto the terminal CDR point in `createInfluxDbPub`

## 5. Verification

- [x] 5.1 Unit tests for `mapAsteriskAmd`
- [x] 5.2 Tests for `createCreateVoiceClient` covering verdict, cause caching, and absence
- [x] 5.3 Confirm in a running container that the gate is inert when `AMD_ENABLED` is unset and
      that `AMD()` runs and honours `amd.conf` when it is set
- [x] 5.4 Confirm in a running container that a missing `app_amd` falls through to Stasis rather
      than hanging the call up
- [x] 5.5 Confirm zero-valued verdict fields survive the proto round-trip under `defaults: false`
- [ ] 5.6 End-to-end on the local stack: originate a call and assert `req.amd` in a voice app
- [ ] 5.7 Validate thresholds against real Spanish-language carrier voicemail before trusting
      `MACHINE` downstream
