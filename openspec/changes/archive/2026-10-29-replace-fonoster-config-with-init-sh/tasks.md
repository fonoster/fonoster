# Tasks

## 1. Installer

- [x] 1.1 `ops/bundle/init.sh` with `test/init.test.ts`, `test/upgrade.test.ts` (0.39 fixture)
- [x] 1.2 Final config names in `ops/bundle/config`; `ops/release/bundle` and `smoke`; compose messages
- [x] 1.3 Drop the `fonoster-config` bin and CLI, `require-on-npm.sh`, the common force-publish
- [x] 1.4 The Ansible stage merges overrides and runs `init.sh`

## 2. Dev container and QA stack

- [x] 2.1 `ops/rebuild/merge-config.cjs` and its test; `.devcontainer/initialize.sh`; `dev:info`
- [x] 2.2 `ops/rebuild/stack` on `.local/.env`, `merge-config.cjs` and `init.sh`; `bundle.test.ts`

## 3. Regions

- [x] 3.1 `compose.region.yaml`, `config/region/`, `playbooks/region.yml`, the archive's `ansible/`
- [x] 3.2 The dashboard's install command and its test; `ops/rebuild/cell` removed

## 4. Proof and docs

- [x] 4.1 OPS-001 and OPS-002 (`ops/bundle/test/install.sh`)
- [x] 4.2 Self-hosting, Upgrade and Install a private region pages; AGENTS.md
