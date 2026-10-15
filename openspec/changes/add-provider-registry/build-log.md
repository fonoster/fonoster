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

### Not done

- 1.1 suite against a real temporary database, 1.4 database-role checks, 1.5 adapter conformance,
  1.6 gateway scenarios, 2.1 tables, 2.5 webhooks, 2.6 transaction, 2.7 roles, 3.x adapters and
  gateway resolution, 4.x platform surfaces, 5.x migration and docs.
