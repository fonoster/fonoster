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

## 2026-10-15 (persistence stream)

### P-B1. Database stores keep the synchronous interfaces

- `RegistryStore`, `UsageSource` and `WebhookStore` stay synchronous (the registry and the
  gateway's Catalog call them inline). The Prisma stores load a snapshot, write behind in order
  (`WriteBehind`), and `flush()` waits for the writes and throws the first failure. The utility
  flushes before it exits; the gateway refreshes on a timer.
- *Why:* no rewrite of the tested registry logic or of the gateway's call path. *Cost:* a
  long-running process sees other writers' changes only after `refresh()`.

### P-B2. Registry tables (task 2.1)

- In the apiserver schema, inside a `// rebuild: persistence` block, migration
  `20261015120000_rebuild_persistence` (additive only): `registry_providers`, `registry_models`,
  `registry_voices`, `registry_voice_models` (with `position`, so a voice's model order survives),
  `registry_audit` (append-only, `details` JSON), `registry_notices` (dashboard warnings per
  workspace), `workspace_provider_keys` (workspace + provider → `secrets.ref`; the key itself only
  lives in the encrypted, write-only Secret).
- Lifecycle is a Postgres enum (`ACTIVE | DEPRECATED | RETIRED`). The voice → model relation has no
  foreign key to the model: `apply` may write a voice before its models; the registry checks it.
- Secret safety (1.4): a test asserts no `registry_*` column is named like a secret, key, token,
  password or hash; `export` already refuses secret-looking input (PR2).

### P-B2a. Database roles (task 2.7)

- `mods/apiserver/sql/registry-roles.sql`, run by the owner after migrations (not a Prisma
  migration: roles are cluster-wide and deployments name their own logins).
- `fonoster_registry` (the utility): writes the catalog, appends to the audit and notices, writes
  webhook deliveries, and may update only `applications` speech columns and
  `intelligence_services.config` (retire rewrites). The spec says "only registry and audit
  tables"; rewrites need those two column grants, so that is the narrowest working role.
- `fonoster_registry_reader`: read-only on the registry tables, for the apiserver and gateway logins.
  It only restricts roles that do not own the tables, so services must not connect as the
  migration owner (today they do; changing that is a deployment step).
- Tested by switching roles in a transaction: secrets, app URLs, audit updates and endpoint deletes
  are denied.

### P-B3. `fonoster-registry --store database`

- `--store database` or `FONOSTER_REGISTRY_STORE=database`, URL from `--database-url` or
  `FONOSTER_REGISTRY_DATABASE_URL`. The client is loaded at run time (`FONOSTER_PRISMA_CLIENT`,
  default `@prisma/client`), so `@fonoster/common` has no hard dependency on a generated client.
- Usages (task 2.6 transaction, 2.5 webhooks): apps (`speech_voice`, `speech_tts_model`,
  `speech_stt_model`, `speech_settings` keys as settings) and assistants (the Autopilot assistant in
  the app's Intelligence config: `languageModel.model`, with tools → requires `tool-calling`, and
  `conversationSettings.voice`). Legacy rows with raw vendor names are not usages until 5.1 maps
  them.
- Rewrites are optimistic: each only applies if the field still holds the value read. A skipped
  one is printed and audited as `rewrite-skipped`; the config keeps the old id. Not one database
  transaction across all configs (each rewrite is its own statement).
- Deprecation stores one `registry_notices` row per workspace and, when
  `FONOSTER_REGISTRY_ENCRYPTION_KEY` (the apiserver's key, to sign with endpoint secrets) is set,
  publishes one `provider.deprecated` webhook per workspace, attempts it once, and leaves retries
  in `webhook_deliveries` for a running dispatcher to adopt (P-B6 in add-workspace-webhooks).
  Without the key it says so and only stores the notices.

### P-B4. The gateway can read the catalog from the database

- Gateway config `registry: {source: database, refreshMs}` (with `database`): the Catalog uses a
  `PrismaRegistryStore`, reloaded every 30 s by default. `registry: {file}` still works.
- `@prisma/client` and `prisma-field-encryption` are declared in the gateway's package.json (both
  already in the workspace's node_modules; nothing installed). Images that use the database need
  a client generated from the apiserver schema (or `database.clientModule`).

### Not done (persistence stream)

- 1.1 as a full scenario suite, 4.3 API/UI for workspace keys (table only), runtime
  `provider.deprecated_used` → dashboard notice (the gateway records it in the call record only).

## 2026-10-15 (control stream)

### CP-B6. Catalog listing and workspace keys API (4.3)

- New gRPC service `fonoster.providers.v1beta2.Providers`: `ListCatalog` (providers, models,
  voices; retired items and other workspaces' custom voices hidden; filter by kind/type),
  `SetProviderKey`, `ListProviderKeys`, `DeleteProviderKey`.
- A key is a Secret named `provider-key/<provider>` bound by `workspace_provider_keys`; setting
  it again overwrites the Secret in place. Nothing returns a key. Not an interactive transaction:
  the field-encryption extension wraps the client, so a failed binding deletes the Secret again.
- Set/delete need WORKSPACE_OWNER or WORKSPACE_ADMIN; list and catalog are workspace access.
- The catalog is queried directly (not `PrismaRegistryStore`, which also loads the audit log).
- SDK `Providers`; dashboard Vendor keys page and catalog pickers in the app editor. The gateway
  does not read workspace keys yet (3.2).

## 2026-10-15 (voices stream; live vendor calls approved by the owner, about 3 USD cap)

### VO-B1. PR5 explained: Deepgram finishes at real-time pace; the check closed too early

- Not an audio format problem: both saved syntheses (Deepgram and ElevenLabs, 16 kHz linear PCM)
  transcribe correctly when replayed, and the unchanged live check passed 4 of 4 reruns.
- Cause: Deepgram works through streamed audio at about real-time pace even when it arrives
  faster (10.7 s of audio sent in 1.4 s: last final at 9 s). The live check waited a fixed 8 s,
  then `close()` sent CloseStream and closed the socket at once, discarding every late final. In
  the PR5 runs Deepgram was slow (its TTS took up to 8.5 s), so nothing arrived in time; the
  ElevenLabs step only moved the timing. 
- Fix: `DeepgramSttStream.finish(timeoutMs)` sends CloseStream and waits for Deepgram to close
  the socket. The live check and the live call use it. Regression test: a fake Deepgram that only
  answers after CloseStream.
- Found while there, each with a test that fails on the old adapter:
  - a stream Deepgram closed (1011, NET-0001) went quietly deaf. It now reconnects up to 3 times
    (250/500/750 ms), keeping up to 5 s of frames; then `provider_unavailable` with the close code.
    1008 → `bad_message`. A rejected handshake (401/400) is reported once and not retried.
  - `update()` (language or hints) closed the old socket at once, losing the words just spoken.
    It now sends Finalize + CloseStream and lets the old socket deliver for up to 2 s.
  - KeepAlive every 5 s (was 8 s, close to Deepgram's 10 s idle limit).
- `live-check.ts`: `LIVE_REPLAY_DIR` transcribes saved audio instead of synthesizing (cheapest
  rerun), `LIVE_SAVE_DIR` keeps the audio; reports result counts and errors.

### VO-B2. Hints: keyterm on Nova-3, keywords on older models

- `keyterm` for `nova-3*` and `flux*`, `keywords` for every other model (Deepgram only supports
  keyterm prompting on those). Live: without a hint Deepgram heard "Fonister", "Phonoster",
  "Fodister"; with `keyterm=Fonoster` it heard "Fonoster" in every run, including through the
  real call path (caller audio as PCMU, narrowband).

### VO-B3. Where hints come from

- App default hints: `speech.hints` in gateway YAML, or `speech_settings.hints` (or `keyterms`)
  on the applications row. Sent on every STT stream from the start.
- `listen.update` hints add to the app's defaults (deduplicated case-insensitively, at most 100);
  they replace earlier `listen.update` hints, never the app's.
- Assistants: `conversationSettings.hints` (rework-autopilot); Autopilot sends them with
  `listen.update` when the session starts. Scenario `autopilot/recognition-hints`.

### VO-B4. STT model through the catalog (task 3.3 completed with PR4 and AP-B4)

- App `speech.sttModel` (`speech_stt_model` column) is a catalog id like `deepgram/nova-3`; the
  gateway resolves it like voices: with a registry it must be an STT model in the catalog, a
  retired one plays its replacement and `provider.retired_used`/`deprecated_used` is recorded;
  unknown → non-fatal `invalid_catalog_id` and no STT. Without `sttModel`, the deployment's
  default STT provider and its configured model (as before). `SttAdapter.open` takes `model`.
- The app's TTS model column (`speech_tts_model`) is still not used: ElevenLabs uses the gateway
  provider's `tts.model` (default `eleven_flash_v2_5`). Open.

### VO-B5. Catalog seed for the owner's vendors

- `ops/rebuild/config/catalog-seed.yaml` (`fonoster-registry apply -f`): providers deepgram,
  elevenlabs, openai, groq; models deepgram/nova-3, deepgram/nova-2-phonecall, deepgram/aura-2,
  elevenlabs/eleven_flash_v2_5, openai/gpt-4o-mini, openai/gpt-4.1-mini,
  groq/llama-3.3-70b-versatile; 16 Aura-2 voices (en, es) and 8 ElevenLabs premade voices (ids
  checked against the live voice and model lists, free endpoints). The gateway's provider names
  must equal the catalog's provider ids (`deepgram`, `elevenlabs`); the header shows the config.
- ElevenLabs catalog ids are the vendor's voice ids (`elevenlabs/EXAVITQu4vr4xnSDxMaL` = Sarah);
  names are comments. Friendly aliases would need a catalog field; not done.
- `ops/rebuild/config/registry.json` (the stack's) was left alone; apply the seed to it.

### VO-B6. Live call through the real pieces, and turn latency

- `mods/gateway/scripts/live-call.ts` (skipped unless `LIVE_CALL=1`): the SIP caller bot dials the
  Go media node, the gateway runs Deepgram STT (`nova-3`, hint Fonoster) and the app's voice, the
  hosted Autopilot (`startHostedAutopilot`, registry + credential refs) answers. The caller says
  `scripts/fixtures/question-fonoster.wav` ("Hi there. What does Fonoster do? Please keep it
  short.", 3.1 s). Options: `LIVE_VOICE`, `LIVE_STT`, `LIVE_LLM`, `LIVE_TURNS`,
  `LIVE_TRANSCRIBE`, `LIVE_OUT` (heard.wav and the call record).
- Caller bot (Go): `POST /calls/{id}/audio {"kind":"pcm"}` says 16 kHz PCM (sent as PCMU),
  `GET /calls/{id}/heard` returns what the caller heard, status adds `spokeUntilMs` and
  `firstAudibleAfterMs`.
- **OpenAI blocked**: the key in integrations.json has no credits (HTTP 429
  `insufficient_quota`), so Autopilot said its system error message instead of a model reply.
  Groq is seeded and selectable (`LIVE_LLM=groq/llama-3.3-70b-versatile`, `GROQ_API_KEY`) but was
  not called (not approved for this stream).
- Measured (caller stops → first audible agent audio at the caller), 3 turns:

  | voice | turn latency | turn.ended | app speak after turn.ended | TTS first audio | to caller |
  | --- | --- | --- | --- | --- | --- |
  | deepgram/aura-2-thalia-en | 2389 ms | 729 | 1363 (OpenAI 429) | 287 | 10 |
  | deepgram/aura-2-thalia-en | 1768 ms | 728 | 299 (OpenAI 429) | 511 | 230 |
  | elevenlabs/EXAVITQu4vr4xnSDxMaL | 1410 ms | 732 | 314 (OpenAI 429) | 333 | 31 |

  Transcript at the gateway each time: "Hi there. What does Fonoster do? Please keep it short."
  Greeting first audio after answer: 1.6 s (Aura), 0.57 s (ElevenLabs). Without the LLM, the
  floor is about 730 ms (turn end: `likely_ended` about 430 ms, `ended` about 730 ms after the
  caller stops) plus 300–500 ms TTS first audio; a real reply adds the model's first sentence
  minus the head start Autopilot gets from preparing on `turn.likely_ended`.

### VO-B7. Spend

- Deepgram: about 10 short syntheses and about 20 streaming transcriptions (under 4 minutes of
  audio in total), about 0.05 USD. ElevenLabs: 7 short syntheses (under 600 characters), about
  0.05 USD. OpenAI: 3 requests refused for lack of credit (no charge). Model and voice lists:
  free. Total well under 0.25 USD of the 3 USD cap.

### CP-B12. The gateway uses workspace vendor keys (3.2)

- `PrismaWorkspaceKeys` (common): workspace + provider → the bound Secret's value, cached 30 s.
- Gateway config `workspaceKeys: {enabled, cacheMs}` (needs `database` with the encryption key).
  `Catalog.prepare(workspaceRef)` looks up the workspace's key for each configured provider at
  session start and on handoff (1 s budget; a failed or slow lookup uses the platform keys).
  Resolutions for that workspace then use adapters built with its key; a provider without a
  platform key works for a workspace that brought one. Providers are matched by the gateway's
  provider name (= the catalog provider id).
- Adapters built with workspace keys are cached by provider and key for the process's life, not
  only the session; good enough for now.
- The hosted Autopilot resolves LLM keys the same way (CP-B11).

## 2026-10-15 (leftovers stream)

### LO-B10. Gateway scenarios with fake providers (task 1.6) and provider errors in the record (3.4)

- Scenario setup key `catalog` (schema, SCENARIOS.md, `Setup` type): the voice-session runner
  registers the fake provider, a TTS model and `fake/default`, then each listed voice in its state
  (deprecated or retired with its replacement). Runners that do not support it fail such
  scenarios, as for any setup key.
- New voice-session scenarios: `deprecated-voice-is-reported` (the call goes on;
  `provider.deprecated_used` once per session with the replacement), `retired-voice-resolves`
  (no error, the replacement speaks, `provider.retired_used`), `tts-outage-is-not-switched`
  (`provider_unavailable` with `relatesTo`, one TTS request, no vendor calls, session stays open,
  failure in the record).
- 3.4: errors with a `provider_*` code are also recorded as a `provider.error` event (code,
  relatesTo, session, app), even when the app does not take the speech layer. No failover existed
  and none was added.
- Credential order is one function (`chainKeySources`, gateway): a private cell's secret, then the
  workspace's key, then the platform key named by `credentialRef`; tested in
  `workspaceKeys.test.ts`. Not a scenario file: the fake providers take no key.

### LO-B11. Runtime use reaches the control plane: warnings and session counts (3.3 rest, 4.2 part)

- The gateway publishes `registry.used` once per session and catalog id it resolves (voices and
  STT models): workspace, app, session, call, the id, what was used, and the deprecated/retired
  event when there is one. Reporting never affects the call. Autopilot's LLM resolutions are not
  reported yet.
- The apiserver consumes it (queue group `apiserver-registry-usage`): `registry_usage` counts
  sessions per workspace, id and day (new table, migration `20261015500000_registry_usage`,
  additive; `migrate diff` is empty), and one runtime notice per workspace and deprecated or
  retired id keeps the apps, session count and first/last use. Same trust as other NATS subjects
  (RV-B6): messages are shape-checked, not authenticated.
- `Providers.ListWarnings` (gRPC, SDK `providers.listWarnings()`, role-allowed like ListCatalog):
  every deprecated or retired item (or item of a deprecated provider) that a saved app or assistant
  of the workspace names (with the field, and the voice for a TTS model, so a cloned voice is
  named), or that a session used in the last 7 days. Derived from the catalog's current state, so
  switching every config away clears it, and runtime-only warnings fade 7 days after the last
  session. A retired item still named by a config is one with no compatible replacement.
- Dashboard: the Apps page shows one alert per warning (deprecated: retire date and replacement;
  retired: pick a new model or voice) with the apps that use it and recent runtime use.
- `fonoster-registry usage <id>` with the database prints, per workspace, its sessions in the last
  30 days, then its configs. The utility and reader roles can read `registry_usage`.
- Not done (4.2 rest): pickers filtered by compatibility (the app editor has no TTS model picker
  and assistants are edited as JSON).

### LO-B12. Only usable providers in the catalog (task 4.1)

- `ListCatalog` is the rebuild's GetCapabilities. It now hides providers whose adapter is not
  built in, and, when the apiserver config lists `registry.platformCredentials` (the credentialRef
  names the gateways have), providers with neither one of those nor the workspace's own key; their
  models and voices go with them. Without the setting no credential filtering happens
  (development). The legacy Capabilities service is untouched.

### LO-B13. The registry scenario suite (task 1.1) and what it found

- `mods/apiserver/test/registry/spec.test.ts`: a throwaway database with providers, models,
  voices (one cloned voice) and apps and assistants in two workspaces; one test per spec scenario,
  driving `fonoster-registry` (database store), the Providers handlers, `listWarnings` and the
  runtime-use recorder. Scenarios run elsewhere are listed with their file (gateway credential
  tests, Autopilot, the conformance scenarios of LO-B10, the database-role test); a final test
  fails if any spec scenario is in neither place.
- Fixed on the way, to match the spec:
  - write commands refuse options they do not take: `--api-key` → `unknown option: --api-key`
    (the registry's secret guard stays for `apply` files);
  - every audit entry stores the command line (database flags left out) and the entry before and
    after;
  - `history` prints newest first;
  - the impact report puts the count before the hint: `✗ voice nova-legacy only exists on
    turbo-v2 (3 apps) → needs --voice-map nova-legacy=<voice>`;
  - `plan -f` / `apply -f` accept the short flag.
- Spec deviation kept: the reuse scenario retires `deepgram/enhanced` instead of `nova-2`
  (later scenarios need `nova-2` deprecated, not retired).

