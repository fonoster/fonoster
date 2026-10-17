## Context

`loadServiceConfig` (mods/common) already parses a file, interpolates `${VAR}` at allowed key
paths, resolves `secret://` references and validates strictly. Only the apiserver and Identity use
it. The bundle renders secrets into YAML at `init`, so the allow-list rarely mattered.

## Goals / Non-Goals

- Goals: one file per maintained service, at `/config/<service>.yaml`, secrets as placeholders,
  the same rules in TypeScript and Go, no secret written into YAML by `init`.
- Non-Goals: third-party containers (Postgres, MinIO, NATS, Routr, RTPEngine, Envoy) keep their
  own environment. The region agent and the Helm chart keep their current wiring except where a
  removed key forces a change.

## Decisions

- **Placeholders anywhere.** The allow-list existed so a value shared with a third-party container
  is written once; with secrets kept in `.env`, every secret is such a value. Services interpolate
  every string; `${…}` with an unset variable and no default is a startup error naming the key.
- **Search order** `--config`, `/config`, `/opt/fonoster`, `./config`.
- **Typed placeholders.** A placeholder is a string after YAML parsing; numeric keys that take one
  (ports) accept a numeric string. `check` validates with type coercion for the same reason.
- **Compose passes `.env` with `env_file`** to Fonoster services, so a new placeholder needs no
  compose edit. The file is `${FONOSTER_ENV_FILE:-.env}` so the development stack can point at its
  own.
- **Media node**: `gopkg.in/yaml.v3` parses the file; a small expander walks scalar nodes with
  `interpolateEnv`'s rules. Flags win over the file, the file over deprecated `MEDIANODE_*`
  variables.

## Risks / Trade-offs

- Every `.env` value reaches every Fonoster container. Acceptable on one machine (the owner
  already holds all of them); per-service `environment:` maps remain possible.
- Existing installs keep rendered secrets in `config/*.yaml` until `init` runs again.
