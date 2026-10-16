# Tasks

## 1. Spec

- [ ] 1.1 Proposal, design and delta specs; `openspec validate unify-config-placeholders --strict`

## 2. Loader and CLI (mods/common)

- [ ] 2.1 Search `/config` first; placeholders allowed at any key (`interpolatePaths: ["*"]`)
- [ ] 2.2 `init` writes YAML with placeholders intact (only `#@if` blocks and overlays applied)
- [ ] 2.3 `check` resolves placeholders from `.env`; unset ones named with file and key path
- [ ] 2.4 Profiles: `regions` only; no ClickHouse or observability settings in `.env.example`

## 3. Services

- [ ] 3.1 apiserver and Identity: placeholders anywhere, `telemetry.otlpEndpoint`
- [ ] 3.2 Gateway: `loadServiceConfig`, `encryption.key`, ClickHouse `user`/`password`, telemetry
- [ ] 3.3 Autopilot: `loadServiceConfig`, `encryption.key`, telemetry
- [ ] 3.4 Test: gateway and Autopilot decrypt a vendor key the apiserver encrypted with the same key
- [ ] 3.5 Media node: `/config/medianode.yaml`, `${VAR}` expander, deprecated env fallback

## 4. Bundle and stack

- [ ] 4.1 Examples ship placeholders; compose mounts `/config/<service>.yaml` and `env_file`
- [ ] 4.2 Remove the observability and analytics profiles (services, files, `.env` lines)
- [ ] 4.3 Development stack and `ops/release/bundle` follow; `ops/rebuild/stack smoke` passes

## 5. Docs

- [ ] 5.1 docs/configuration.md and docs-site pages that state env-based config
- [ ] 5.2 How-tos: send call metrics to ClickHouse, send telemetry (Self-hosting → Integrations)
