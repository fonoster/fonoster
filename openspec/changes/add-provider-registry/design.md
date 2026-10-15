## Context

How providers work today:

- **TTS** (Azure, Deepgram, ElevenLabs, Google) and **STT** (Deepgram, Google) are factories in
  `mods/apiserver/src/voice/{tts,stt}`.
- **LLMs** (OpenAI, Anthropic, Google, Groq, Ollama) are the `LanguageModelProvider` enum in
  `mods/common/src/assistants` with LangChain adapters in `mods/autopilot/src/models`.
- **`Product`** (`ref`, `name`, `vendor`, `type`) is a seeded proto-catalog. `vendor` is the
  Prisma enum `ProductVendor`, so adding a vendor is a schema migration.
- **Platform keys** live in `config/integrations.json`, keyed by `productRef` (`tts.google`,
  `stt.deepgram`, ...).
- **Per-application keys** already exist: `TextToSpeech`, `SpeechToText` and `Intelligence` each
  carry an encrypted `credentials` column. Workspace `Secret`s are encrypted with the same field
  encryption.
- **Apps name raw vendor models** (`model: "gpt-4o-mini"`, a Deepgram voice name). Nothing knows
  which models are going away or what a replacement must support.

In the rebuild, STT and TTS run in the VoiceSessionGateway's Speech layer and LLMs in Autopilot
(see `voice-session`, `autopilot`). Both resolve providers through this registry.

## Goals / Non-Goals

**Goals**

- One catalog that says which providers, models and voices exist and what each can do.
- Registering a provider makes it appear in `GetCapabilities` and the dashboard; nothing else does.
- Retiring a model or voice with a replacement causes no work for users whose configs are
  compatible, and a clear warning for those whose configs are not.
- The registry can be read in full by anyone with database access without exposing a secret.
- Several regions and private cells can be kept identical with one reviewed file.

**Non-Goals**

- Judging whether a replacement is good enough. That is done off-system with internal evals.
- Automatic failover between providers during a call.
- Third-party provider plugins or external provider services. Adapters ship in our code.
- Pinning a model to opt out of retirement.
- Billing and usage metering. They read the registry but are specified elsewhere.

## Decisions

### P1. Platform keys by default, bring-your-own per workspace

A call uses the platform key for a vendor (Fonoster's on Cloud, the operator's when self-hosted)
unless the workspace stored its own key for that vendor, in which case that key wins.

- *Why:* a first call works on day one, and enterprises can still use their own vendor contracts
  or models we do not resell.
- *Rejected:* customer keys only (slow onboarding); platform keys only (no vendor contracts).

### P2. Built-in adapters; the registry switches them on

Each vendor is a small adapter package implementing the capability interface for its type (STT,
TTS or LLM) and passing the shared adapter conformance suite. A registry `provider` row names the
`adapter` it uses. `add-provider` refuses an adapter name the running version does not contain.

- *Why:* consistent quality, one test suite, no third-party code in our process.
- *Rejected:* external provider services (a protocol to secure and test); runtime plugins
  (foreign code in the gateway).

### P3. Catalog ids, no pinning

Apps and assistants reference `<provider>/<id>`: `deepgram/nova-3` (model),
`elevenlabs/rachel` (voice). Ids are stable for the life of the entry and never reused.

- *Why:* one indirection lets retirement rewrite configs while users still choose an exact vendor
  model.
- *Rejected:* abstract aliases such as `spanish-female-warm` (users cannot pick an exact model);
  raw vendor names (no lifecycle). Pinning was dropped: a retired model usually stops working at
  the vendor, so there is nothing to stay pinned to.

### P4. A fully manual lifecycle

States: `active` → `deprecated` → `retired`. Every transition is a command an operator runs.

1. `deprecate-<kind> <id> --replacement <id> --retire-on <date> [--note]` requires an active
   replacement of the same kind. It prints the impact report (P9). From then on:
   - the dashboard shows each workspace that uses the item a warning listing where it is used;
   - the gateway emits `provider.deprecated_used` on every session that resolves the item, which
     also catches ids an app sends at runtime and never saves in a config;
   - a workspace's warning clears as soon as none of its configs reference the item and no session
     has used it since it last switched.
2. `retire-<kind> <id>` is run by hand on or after the date. In one transaction it rewrites every
   compatible config to the replacement, records one audit entry per rewritten config, and queues a
   notice to every affected workspace. A retired id sent at runtime resolves to its replacement and
   the gateway emits `provider.retired_used`; the call does not fail because of the id.

`--retire-on` is informational. Nothing runs when the date arrives.

- *Why:* the owner wants full control; a vendor's schedule is often fuzzy and changes.
- *Rejected:* auto-replace after notice; auto-replace immediately; notify only.

### P5. Replacement quality is decided off-system

The registry records the operator's decision and never runs evaluations itself.

### P6. Provider failure is an error, not a switch

If a provider fails or times out during a session, the gateway sends the app an `error` message
(`code: provider_unavailable`, `relatesTo` the command id) and records it in the call record. It
does not try another provider. The app decides what to do.

### P7. Registry in the database, managed by an operator utility

The registry lives in the control-plane database. It is managed only through `fonoster-registry`,
a binary in `@fonoster/common`, run as `npx -p @fonoster/common fonoster-registry <command>`
against a database URL. It is not part of `@fonoster/ctl`, which is for customers and developers.

| Command | Purpose |
| --- | --- |
| `add-provider <provider> --adapter <name> --capabilities stt,tts,llm --credential-ref <name>` | Register a provider backed by a built-in adapter |
| `add-model <provider>/<id> --type stt\|tts\|llm --features <list> [--languages] [--settings-schema <file>]` | Register a model |
| `add-voice <provider>/<id> --models <ids> --language <tag> [--gender] [--style]` | Register a voice and the models it works with |
| `deprecate-provider\|model\|voice <id> --replacement <id> --retire-on <date> [--note]` | Mark deprecated; prints the impact report |
| `retire-provider\|model\|voice <id> [--voice-map <old>=<new>] [--yes]` | Rewrite compatible configs, notify, audit |
| `usage <id>` | Workspaces and configs that reference the id, and sessions that used it in the last 30 days |
| `list`, `show <id>`, `history <id>` | Read the catalog and its audit trail |
| `export`, `plan -f <file>`, `apply -f <file>` | Snapshot the catalog (no secrets) and make another database match it |

`retire-*` prints the impact report and asks for confirmation unless `--yes` is given.

- *Why:* catalog changes happen when a vendor moves, not when we release; regions must stay
  identical; operators, not customers, own the catalog.
- *Rejected:* a catalog file shipped with each release (too slow); ctl commands (wrong audience).

### P8. Secrets never enter the catalog

1. The registry schema has no field that can hold a key. A provider refers to its platform
   credential by name (`credentialRef: deepgram-default`).
2. Platform keys stay in the operator's config or secret store (`fonoster.yaml` with `secret://`
   references to a file, Kubernetes, Vault or AWS Secrets Manager). The utility never reads them.
3. A workspace's own key is a workspace `Secret`, encrypted at rest and write-only: no API returns
   it, no log prints it, no call record contains it. A workspace binds it to a provider by name.
4. Only the gateway resolves keys, once at session start, and holds them in memory for that session
   only. Resolution order: the workspace's own key for that provider, else the platform key.
5. A private region or cell resolves keys from its own secret store; the registry it receives via
   `apply` carries only names.
6. Every registry write appends an audit entry: operator identity, time, command, before and after.
7. The utility connects with a database role that can write only the registry and audit tables;
   the apiserver's role can only read them.

### P9. Compatibility from declared features and derived requirements

- **Features** come from a fixed vocabulary per type. Each feature is **hard** (an app that needs
  it breaks without it) or **soft** (it degrades). Initial vocabulary:

  | Type | Feature | Hard or soft |
  | --- | --- | --- |
  | TTS | `streaming-input` | hard |
  | TTS | `word-timings` | soft (interruption reports fall back to elapsed time) |
  | TTS | `ssml` | soft |
  | TTS | `sample-rate:<hz>` | soft (the gateway resamples) |
  | STT | `interim-results` | soft |
  | STT | `word-timings` | soft |
  | STT | `turn-detection` | soft |
  | STT | `keyword-boosting` | soft |
  | STT | `language-switching` | hard when the app switches language mid-call |
  | LLM | `tool-calling` | hard when tools are defined |
  | LLM | `parallel-tool-calls` | soft |
  | LLM | `streaming` | hard for Autopilot |
  | LLM | `structured-output` | hard when a JSON schema is requested |
  | LLM | `setting:temperature` | soft (dropped when unsupported) |
  | all | `language:<tag>` | hard |

- **Voices and models** are many-to-many: an ElevenLabs voice works on several models, a Deepgram
  Aura voice on exactly one.
- **Requirements are derived**, never declared by users: tools defined → `tool-calling`; a
  Spanish app → `language:es`; Autopilot → `streaming`.
- **One checker, three places.** The dashboard offers only voices valid for the chosen model and
  greys out models missing a hard requirement. `deprecate-*` and `retire-*` run the checker over
  every usage. Deprecating a model cascades to voices that exist only on that model; they need a
  mapping (`--voice-map`) or are reported as unmappable. Settings the replacement does not accept
  are dropped or clamped and listed in the report.

### P10. Unmappable usages: retire anyway

`retire-*` proceeds even when some usages have no compatible replacement. Those configs keep the
old id, stay flagged in the dashboard, and their sessions receive `error` with
`code: provider_unavailable` once the vendor shuts the model off. Custom or cloned voices belong to
a workspace, not the catalog; deprecating their model warns that workspace by name, and the
workspace picks a new model or voice itself.

### Capabilities exposure

`GetCapabilities` and the dashboard list a provider only when it is `active` or `deprecated`, its
adapter exists in the running version, and a credential is available to the asking workspace
(platform key configured, or the workspace's own key stored). Retired items are never offered.

## Risks / Trade-offs

- **Manual lifecycle can lag a vendor shutoff.** If nobody runs `retire-*`, calls fail with
  `provider_unavailable`. Mitigation: `usage` and dashboard warnings make the exposure visible
  well before.
- **Retire rewrites customer configs.** The rewrite is audited per config and announced, and only
  compatible configs are touched.
- **The feature vocabulary can drift from reality.** Adapter conformance verifies every declared
  feature against the live vendor (on demand).
- **Runtime-only ids are invisible to static usage.** The `provider.deprecated_used` event closes
  that gap, but only for workspaces that actually place calls during the deprecation window.
- **One more privileged tool.** The utility's database role is restricted to registry tables and
  every write is audited.

## Open Questions

1. Final feature vocabulary: the table in P9 is a starting set; which features ship in v1?
2. Migration from `Product`: map `ProductVendor`/`ProductType` rows and today's raw model names to
   catalog ids, and move per-application `credentials` columns into workspace Secrets. Who signs
   off the mapping table?
3. Runtime usage window: is "used by a session in the last 30 days" the right horizon for
   `usage` and for clearing a warning?
4. Notices: in-dashboard only, or also email to workspace owners on deprecate and retire?
5. Provider-level deprecation: does `deprecate-provider` require a replacement provider, or a
   per-model replacement map?
6. Who holds operator identity for the audit when the utility runs in CI (the `apply` path)?
