# Build log: add-provider-registry

Decisions taken while building, for the owner to review. Each can be reversed.

## 2026-10-15 (overnight, owner asleep)

### PR1. Registry logic first, database later

- `mods/common/src/registry/` holds the registry: catalog entries (provider, model, voice) with
  `active | deprecated | retired`, the feature vocabulary, deprecate and retire with the shared
  impact report, config rewrites, audit, runtime resolution, and `export` / `plan` / `apply`.
- It works against two interfaces: `RegistryStore` (catalog + audit) and `UsageSource` (where apps
  and assistants use an id; rewrites; workspace notices). **No database tables or migrations were
  added**: `next` is shared with other work and schema changes deserve your review. The
  `fonoster-registry` binary (`mods/common`, `bin`) uses a JSON file
  (`FONOSTER_REGISTRY_FILE`, default `./registry.json`) and knows no usages yet.
- Next step: a Prisma `RegistryStore` and a `UsageSource` over apps and assistants (tasks 2.1, 2.6,
  2.7), then `GetCapabilities` and the gateway's credential resolution.

### PR2. Rules chosen

- Built-in adapters: deepgram, elevenlabs, google, azure, openai, anthropic, groq, ollama, fake.
  `fake` is refused unless test mode (`FONOSTER_TEST_MODE=true`).
- Secret guard: any input key matching api-key/secret/token/password/private-key, or any value
  starting like a known key (`sk-`, `AKIA`, `AIza`, PEM...), is refused with a pointer to
  `--credential-ref`. `credentialRef` must be a lowercase name.
- Features: llm `tool-calling`(hard) `streaming`(hard) `json-mode` `vision`; tts `streaming`(hard)
  `word-timings` `ssml`; stt `streaming`(hard) `interim-results` `word-timings` `turn-detection`
  `multilingual`. Assistants with tools require `tool-calling`.
- Models list the settings they accept (`--settings`); a usage's settings the replacement does not
  accept are reported as dropped (soft) and removed on retirement.
- Retiring requires a prior deprecation with a replacement; unmappable usages keep the old id.
- `export` is YAML (`fonoster.catalog.v1`), keys sorted so equal catalogs export byte-identical;
  `apply` writes one audit entry per change and reports `no changes` when idempotent.

### PR3. First vendor adapters on the streaming interfaces

- `mods/gateway/src/speech/deepgram.ts` (STT over WebSocket with interim results, `keyterm` hints,
  reconnect on language change; TTS over HTTP as 16 kHz linear PCM) and `elevenlabs.ts` (TTS as raw
  `pcm_16000`, default model `eleven_flash_v2_5`), ported from the apiserver adapters. Plain
  HTTP/WebSocket, no vendor SDKs; each takes a base URL override.
- Gateway config: `providers.<name>: {adapter: deepgram | elevenlabs, credential: {env | value},
  tts/stt: {url?, model?}}` (platform keys in operator config, P3). Vendor failures map to
  `provider_unavailable`, `provider_timeout` or `bad_message`.
- Tested against local stand-ins of the vendor endpoints only; **no live call was made** (live
  tests run by hand, T4). ElevenLabs word timings are not used yet.
- Not ported yet: Google and Azure TTS/STT, LLM adapters.

### PR4. The gateway resolves voices through the registry

- Gateway config `registry: {file}`: voice ids must exist in the catalog; a retired id plays its
  replacement; the first deprecated or retired use per session and id is recorded as
  `provider.deprecated_used` / `provider.retired_used` (with the id, replacement, session and app)
  in the call record. Forwarding these to the control plane (dashboard warnings) is not done.
- Only voices go through it so far; STT models and LLM ids do not.

### Not done

- 1.1 suite against a real temporary database, 1.4 database-role checks, 1.5 adapter conformance,
  1.6 gateway scenarios, 2.1 tables, 2.5 webhooks, 2.6 transaction, 2.7 roles, 3.x adapters and
  gateway resolution, 4.x platform surfaces, 5.x migration and docs.

## 2026-10-15 (morning, with the owner)

### PR5. First live check (T4), keys from config/integrations.json with the owner's approval

- `mods/gateway/scripts/live-check.ts` (keys from the environment only, never printed).
- Deepgram TTS: works (about 4.4 s of audio for the test sentence, 2.5–8.5 s to complete).
- ElevenLabs TTS (`pcm_16000`, eleven_flash_v2_5): works (about 4.5 s of audio, about 1.1 s).
- Deepgram STT (nova-3, streaming): works when run alone or in a direct probe ("Hello from
  Finaster. This is a live check of the new speech adapters."), but returned no transcript in both
  runs where it followed the ElevenLabs synthesis in the same process. Cause not found yet; to
  investigate before relying on it. "Fonoster" is misheard without a `keyterm` hint.

## 2026-10-15 (spec review rulings, with the owner)

A separate reviewer read every rebuild spec; the owner ruled on each finding one by one.

### PR6. Credentials are resolved per layer

- The gateway resolves speech credentials, Autopilot resolves its LLM credential through the same
  registry API (matches AP2). Credentials never travel in the session protocol. Two scenarios that
  named nonexistent `listen.update` / `speak` model fields were rewritten.
