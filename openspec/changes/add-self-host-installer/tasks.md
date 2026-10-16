## 1. Shared code moves

- [ ] 1.1 Move `generateRegionHub` and its NATS JWT helpers from `mods/apiserver/src/regions/` to `mods/common/src/regions/hub/`; apiserver imports from `@fonoster/common`; `mods/apiserver/test/regions` passes unchanged
- [x] 1.2 Apiserver applies the catalog file named in `catalog.file` on every start (add/update, never delete); tests for first boot and restart-no-change
- [x] 1.3 Remove `seed_catalog` from `ops/rebuild/stack`; `stack smoke` still passes

## 2. Bundle source

- [ ] 2.1 `ops/bundle/compose.yaml`: images only (`fonoster/<svc>:${FONOSTER_VERSION}`), default + `observability`, `analytics`, `regions` profiles, standard ports from `.env`, no fakes/caller bot
- [ ] 2.2 `ops/bundle/config/*.example.*` with `${NAME}` placeholders for every file `render_configs` writes today, plus `catalog.yaml` and `envoy.yaml`
- [ ] 2.3 `ops/bundle/.env.example` (Compose-level values only) and `ops/bundle/README.md` (three commands + docs link)
- [ ] 2.4 Turn `ops/rebuild/compose.yaml` into an override (build sections, fakes, tools, 16000-range ports); `ops/rebuild/stack` renders from `ops/bundle/config` examples and runs both files; `stack smoke` passes

## 3. fonoster-config utility

- [ ] 3.1 `fonoster-config` bin in `@fonoster/common` (`src/config/cli/`) with `init`, `info`, `check` and `--help`
- [ ] 3.2 `init`: secrets (Node `crypto`), RS256 + ES256 keys, region hub, host address with `--host-ip`, render `config/*.yaml` and `.env`, file modes; tests: fresh folder, re-run keeps secrets byte-for-byte, new secret appended, no address found
- [ ] 3.3 `info`: dashboard URL, owner login, SIP address, paths; non-zero before `init`; tests
- [ ] 3.4 `check`: validate rendered YAMLs against `config/schemas/*.json`, resolve `secret://` refs without printing values, key suggestions via `configHints`; tests: valid after `init`, typo reported with suggestion

## 4. Local bundle build

- [x] 4.1 Export each service's config schema to JSON Schema (apiserver, identity, gateway, autopilot) as a build step
- [ ] 4.2 `ops/release/bundle [version]`: build images tagged `fonoster/<svc>:<version>`, render the archive, `npm pack` `@fonoster/common`, write `dist/release/<version>/`
- [ ] 4.3 Scan test: archive files and `init`/`info`/`check` output contain no `rebuild` or `RB_`

## 5. Verification

- [ ] 5.1 Clean-folder install from the local bundle on this Mac: unpack, `init`, `check`, `docker compose up -d`, sign in to the dashboard, add a provider key, create an Autopilot app, call it from a softphone
- [ ] 5.2 Same on a Linux host (the second machine or a VM)
- [ ] 5.3 Record install time, image pull/build size and each friction point in `.claude/docs/install-compose.md`
