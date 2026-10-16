# Operating the provider registry

The registry is the catalog of the speech and LLM vendors the platform can use: providers, the
models they offer (STT, TTS, LLM) and voices. Apps and assistants name catalog ids such as
`deepgram/nova-3`; the gateways and Autopilot resolve them at session start. The catalog holds no
keys, only a `credentialRef` name per provider.

You change it with `fonoster-registry` (installed with `@fonoster/common`). For what users see,
read [Providers](../providers.md).

## Where the catalog lives

| Store | Select with | Notes |
| --- | --- | --- |
| File (default) | `FONOSTER_REGISTRY_FILE` (default `./registry.json`) | No usages are known, so impact reports are empty and nothing is rewritten. Fine for a laptop. |
| Database | `--store database` or `FONOSTER_REGISTRY_STORE=database` | The registry tables of the control-plane database. Knows which apps and assistants use each id; deprecation stores workspace notices. |

For the database store, give the URL with `--database-url` or `FONOSTER_REGISTRY_DATABASE_URL`.
Set `FONOSTER_REGISTRY_ENCRYPTION_KEY` (the API server's field-encryption key) to also send
`provider.deprecated` [webhooks](../webhooks.md); without it the notices are stored and the
command says so. The utility loads a Prisma client at run time (`FONOSTER_PRISMA_CLIENT`, default
`@prisma/client`), generated from the API server schema.

Database roles: after migrations, run `mods/apiserver/sql/registry-roles.sql`. `fonoster_registry`
is the utility's login (writes the catalog and audit, rewrites speech columns of apps and the
config of intelligence services); `fonoster_registry_reader` is read-only for the API server and
gateways. The roles restrict only logins that do not own the tables.

Point the gateways at the same catalog: `registry: {source: database, refreshMs}` (with
`database`), or `registry: {file}` for a file. They reload every 30 seconds by default.

## Commands

```sh
fonoster-registry add-provider <id> --adapter <a> --capabilities stt,tts --credential-ref <name>
fonoster-registry add-model <provider/model> --type stt|tts|llm [--features a,b] [--languages en,es] [--settings s]
fonoster-registry add-voice <provider/voice> --models <m1,m2> [--language en] [--gender female]
fonoster-registry deprecate-provider|deprecate-model|deprecate-voice <id> --replacement <id> --retire-on YYYY-MM-DD
fonoster-registry retire-provider|retire-model|retire-voice <id> [--voice-map old=new,...] --yes
fonoster-registry usage <id>
fonoster-registry list [provider|model|voice]
fonoster-registry show <id>
fonoster-registry history [<id>]
fonoster-registry export
fonoster-registry plan -f <file>
fonoster-registry apply -f <file>
```

Rules:

- Built-in adapters: `deepgram`, `elevenlabs`, `google`, `azure`, `openai`, `anthropic`, `groq`,
  `ollama`, `fake`. `fake` needs `FONOSTER_TEST_MODE=true`. An entry whose adapter is not built
  into the gateway is hidden from users. Adapters shipped for speech today: Deepgram and
  ElevenLabs; for LLMs, OpenAI-compatible ones.
- Features describe what a model can do. Hard features break a config if missing:
  LLM `tool-calling`, `streaming`; TTS `streaming`; STT `streaming`. Soft ones only degrade:
  LLM `json-mode`, `vision`; TTS `word-timings`, `ssml`; STT `interim-results`, `word-timings`,
  `turn-detection`, `multilingual`. Assistants with tools need `tool-calling`.
- A model lists the `--settings` it accepts. Settings a replacement does not accept are dropped
  on retirement.
- Keys never enter the catalog. Write commands refuse unknown options (`--api-key` fails with
  `unknown option`), and input that looks like a secret is refused with a pointer to
  `--credential-ref`. `credentialRef` is a lowercase name that the gateway and Autopilot map to a
  key in their own config.
- Every write is audited (actor, time, command line without database flags, entry before and
  after). `history` prints newest first.

## Deprecate, then retire

An item is `active`, `deprecated` or `retired`. You deprecate with a replacement and a date, then
retire it yourself on or after that date. Nothing retires on its own.

1. **Add the replacement** and make sure it is `active` (same kind; a model needs the same type).
2. **Deprecate**:

   ```sh
   fonoster-registry deprecate-model deepgram/nova-2 --replacement deepgram/nova-3 --retire-on 2026-12-01 --store database
   ```

   It prints the impact: one line per kind of effect, with how many apps are affected.
   `✓` moves cleanly, `~` a soft loss (a setting dropped), `✗` blocks (a hard feature the
   replacement lacks, or a voice that exists only on the old model, shown with the
   `--voice-map` you will need). Each affected workspace gets a notice (dashboard warning and
   a `provider.deprecated` webhook with `id`, `replacement`, `retireOn`). Calls keep working;
   sessions that use the id record `provider.deprecated_used`.
3. **Watch usage**: `fonoster-registry usage deepgram/nova-2 --store database` prints, per
   workspace, the sessions that used the id in the last 30 days and the configs that name it.
4. **Retire** on or after the date. Without `--yes` it only prints what would change and exits
   with code 1:

   ```sh
   fonoster-registry retire-model deepgram/nova-2 --voice-map nova-legacy=aura-2-thalia-en --yes --store database
   ```

   Every compatible config is rewritten to the replacement (each rewrite applies only if the field
   still holds the value read; a skipped one is printed and audited as `rewrite-skipped`).
   Configs that cannot move (the output marks them `✗`) keep the old id. At session start the
   gateway still substitutes the replacement for a retired id, so change those configs by hand;
   the dashboard keeps warning about them until you do.
5. **Check**: `history <id>`, and `list` shows the state.

A retired id is not an error at session start: the gateway uses the replacement and records
`provider.retired_used`.

## Keep regions identical (export, plan, apply)

`export` prints the catalog as YAML (`fonoster.catalog.v1`, keys sorted, so equal catalogs export
byte-identical). Keep that file in version control and treat it as the source of truth:

```sh
fonoster-registry export > catalog.yaml          # from a region you trust
fonoster-registry plan -f catalog.yaml           # against another region: what would change
fonoster-registry apply -f catalog.yaml          # apply it; "no changes" when already equal
```

`ops/rebuild/config/catalog-seed.yaml` is a starting catalog (Deepgram, ElevenLabs, OpenAI, Groq).
Load it once after the API server has migrated:
`fonoster-registry apply -f ops/rebuild/config/catalog-seed.yaml --store database`.

## Multi-region notes

- Each region (and each private region) resolves against its own catalog. The control plane's
  catalog is the one the dashboard shows. A private region receives the catalog entries its
  workspaces use through config sync; it does not run `fonoster-registry` itself.
- Roll a catalog change region by region: `plan` first, then `apply`. Deprecate in the control
  plane first so every workspace gets its notice before any region retires the item.
- Keys differ by region. A gateway picks a key in this order: a private region's own secret
  (`fonoster-region secrets set <provider>`), then the workspace's own key, then the platform
  key named by `credentialRef`. See [Running a region](./regions.md).
- Retire in each region separately: `retire-*` rewrites that region's configs.
