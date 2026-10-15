> Build started 2026-10-15 under the owner's overnight go-ahead. Decisions: see build-log.md.

## 1. Conformance assets

- [ ] 1.1 Registry utility suite: a temporary database with fixtures (providers, models, voices, apps across two workspaces) that runs every scenario in `specs/provider-registry/spec.md`
- [x] 1.2 Impact-report fixtures: the `turbo-v2` → `flash-v2.5` case with mappable, unmappable and dropped-setting usages, with expected report text
- [x] 1.3 Two-database fixture for `export` / `plan` / `apply`, including the idempotency check
- [x] 1.4 Secret-safety checks: no schema column can hold a credential, `export` output has no secret, the utility's role cannot write outside registry and audit tables
- [ ] 1.5 Adapter conformance suite per type (STT, TTS, LLM): every declared feature is verified, cancel is fast, vendor errors map to `provider_unavailable`; live runs on demand only
- [ ] 1.6 Gateway scenarios with fake providers: credential resolution order, `provider.deprecated_used`, `provider.retired_used`, `provider_unavailable` with no switching

## 2. Registry and utility (`mods/common`)

- [x] 2.1 Registry and audit tables (provider, model, voice, voice-model relation, lifecycle fields, replacement, retire date, credentialRef); no secret-capable field
- [x] 2.2 Feature vocabulary with hard or soft marks, and the compatibility checker (requirements derived from app and assistant configs)
- [x] 2.3 `fonoster-registry` binary: add, deprecate and retire for provider, model and voice; `usage`, `list`, `show`, `history`; `export`, `plan`, `apply`
- [x] 2.4 Impact report shared by `deprecate-*` and `retire-*`, with `--voice-map` and confirmation
- [x] 2.5 Emit `provider.deprecated` workspace webhooks on deprecate (`add-workspace-webhooks`)
- [x] 2.6 Retire transaction: rewrite compatible configs, audit per config, notices, mark retired
- [x] 2.7 Restricted database role for the utility; read-only role for the apiserver

## 3. Adapters and gateway

- [ ] 3.1 Move TTS and STT adapters out of `mods/apiserver/src/voice` and LLM adapters out of `mods/autopilot/src/models` into one package per vendor behind the type interfaces
- [x] 3.2 Gateway credential resolution at session start (workspace key, else platform key by `credentialRef`), held in memory for the session only
- [x] 3.3 Runtime events `provider.deprecated_used` and `provider.retired_used`; retired ids resolve to their replacement
- [ ] 3.4 `provider_unavailable` errors to the app and the call record; no failover

## 4. Platform surfaces

- [ ] 4.1 `GetCapabilities` lists only active or deprecated items with an adapter and an available credential
- [ ] 4.2 Dashboard pickers filtered by compatibility; deprecation and retirement warnings per workspace with where-used lists
- [x] 4.3 Workspace UI and API to store and bind a bring-your-own key as a write-only Secret

## 5. Migration and docs

- [ ] 5.1 Map `Product` rows (`ProductVendor`, `ProductType`) and today's raw model names to catalog ids; seed the registry
- [ ] 5.2 Move per-application `credentials` columns (`TextToSpeech`, `SpeechToText`, `Intelligence`) into workspace Secrets
- [ ] 5.3 Move `integrations.json` platform credentials into the operator config or secret store with `credentialRef` names
- [ ] 5.4 Operator guide for `fonoster-registry`, including the deprecate-then-retire runbook and multi-region sync
- [ ] 5.5 User docs: catalog ids, bringing your own key, what deprecation warnings mean
