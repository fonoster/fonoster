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
