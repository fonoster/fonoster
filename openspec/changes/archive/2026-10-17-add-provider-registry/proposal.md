## Why

Speech and language vendors ship new models every few weeks and retire old ones on their own
schedule. Today Fonoster hardcodes them: TTS and STT adapters live in the apiserver, LLMs are a
fixed enum inside Autopilot, the `Product` table names vendors through a database enum (a new
vendor needs a migration), and apps reference raw vendor model names. There is no catalog, no way
to tell a workspace it uses something that is going away, and no safe way to replace it.

The rebuild needs one place that says what exists, what each thing can do and how it is
retired, kept strictly apart from the keys that pay for it.

## What Changes

- **A provider registry in the database**: providers, models and voices, each with a lifecycle
  state (`active`, `deprecated`, `retired`), a declared feature set and, once deprecated, a
  replacement and a retire date. The registry never stores a secret.
- **Built-in adapters only.** Each vendor is an adapter in our code with a shared adapter
  conformance suite. The registry only switches adapters on; it refuses one the running version
  does not contain.
- **Catalog ids** of the form `<provider>/<id>` (`deepgram/nova-3`, `elevenlabs/rachel`) are what
  apps and assistants reference. There is no pinning.
- **An operator-only utility in `@fonoster/common`**, `fonoster-registry`, run with
  `npx -p @fonoster/common fonoster-registry <command>`. Commands: `add-`, `deprecate-` and
  `retire-` for `provider`, `model` and `voice`; `usage`, `list`, `show`, `history`; and
  `export`, `plan`, `apply` to keep several regions' registries identical. It is not part of the
  customer-facing ctl.
- **A fully manual lifecycle.** `deprecate-*` makes every workspace that uses the item see a
  dashboard warning that names where it is used, and pushes a `provider.deprecated` workspace
  webhook; the warning clears when they switch. `retire-*`,
  run by hand on the final date, rewrites every compatible config to the replacement, notifies
  every affected workspace and is audited. Nothing happens on a timer.
- **Compatibility checks.** Models declare features from a fixed vocabulary, each marked hard or
  soft; voices list the models they work with. The platform derives each app's requirements from
  its config and runs the same check in the dashboard, at deprecate (an impact report that cascades
  to voices and settings) and at retire. Usages with no compatible replacement are reported and
  left as they are.
- **Credentials apart from the catalog.** Platform keys (ours on Cloud, the operator's when
  self-hosted) stay in the config or secret store and are referenced by name. A workspace may bring
  its own key per vendor as an encrypted, write-only workspace Secret. Only the gateway resolves
  keys, at session start.
- **No automatic failover.** A provider that fails during a call produces an error event to the
  app; the gateway does not switch providers.
- **`GetCapabilities` and the dashboard** list only providers that are enabled and have a usable
  credential.

## Capabilities

### New Capabilities

- `provider-registry`: the catalog of providers, models and voices, their features and lifecycle,
  the operator utility that manages it, how credentials are resolved without ever entering the
  catalog, and the compatibility checks that guard deprecation and retirement.

### Modified Capabilities

None. There is no existing spec for providers.

## Impact

- **Affected code (when built):** `mods/common` (registry schema, `fonoster-registry` binary,
  feature vocabulary, compatibility checker), the voice worker's gateway (credential resolution,
  runtime `provider.deprecated_used` events, provider errors), adapters moved out of `mods/apiserver/src/voice/{tts,stt}`
  and `mods/autopilot/src/models`, the apiserver (`GetCapabilities`, registry reads), the dashboard
  (pickers, deprecation warnings).
- **Data:** new registry tables and an audit table. The `Product` table and its `ProductVendor` /
  `ProductType` enums are replaced; per-application `credentials` columns on `TextToSpeech`,
  `SpeechToText` and `Intelligence` move to workspace Secrets.
- **Config:** `integrations.json` platform credentials move into the operator's config or secret
  store, referenced by `credentialRef`.
- **BREAKING for configs:** raw vendor model names become catalog ids. A one-time migration maps
  today's names.
- **Depends on:** `voice-session` (the gateway is the only component that resolves keys and calls
  adapters). **Used by:** `autopilot`, `voice-sdk`, `call-record` (provider switches and
  deprecation warnings are recorded).
