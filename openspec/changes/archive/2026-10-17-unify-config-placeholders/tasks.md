# Tasks

## 1. Spec

- [x] 1.1 Proposal, design and delta specs; `openspec validate unify-config-placeholders --strict`

## 2. Loader and CLI (mods/common)

- [x] 2.1 Search `/config` first; placeholders allowed at any key (`interpolatePaths: ["*"]`)
- [x] 2.2 `init` writes YAML with placeholders intact (only `#@if` blocks and overlays applied)
- [x] 2.3 `check` resolves placeholders from `.env`; unset ones named with file and key path
- [x] 2.4 No profiles (CP-B9..B11); no ClickHouse, observability or region-hub settings in `.env.example`

## 3. Services

- [x] 3.1 apiserver and Identity: placeholders anywhere, `telemetry.otlpEndpoint`
- [x] 3.2 Gateway: `loadServiceConfig`, `encryption.key`, ClickHouse `user`/`password`, telemetry
- [x] 3.3 Autopilot: `loadServiceConfig`, `encryption.key`, telemetry
- [x] 3.4 Test: gateway and Autopilot decrypt a vendor key the apiserver encrypted with the same key
- [x] 3.5 Media node: `/config/medianode.yaml`, `${VAR}` expander, deprecated env fallback

## 4. Bundle and stack

- [x] 4.1 Examples ship placeholders; compose mounts `/config/<service>.yaml` and `env_file`
- [x] 4.2 Remove the observability, analytics and regions profiles (services, files, `.env` lines)
- [x] 4.3 Development stack and `ops/release/bundle` follow; `ops/rebuild/stack smoke` passes

## 5. Docs

- [x] 5.1 docs/configuration.md and docs-site pages that state env-based config
- [x] 5.2 How-tos (ClickHouse, telemetry, hosting private regions): the coordinator writes them (moved to openspec/rc-checklist.md, 2026-10-17)
