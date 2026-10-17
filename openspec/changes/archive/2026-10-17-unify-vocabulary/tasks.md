## 1. API and data

- [x] 1.1 Proto: `ApplicationType.STREAM` (was `EXTERNAL`), field `protocol` (was `flavor`); regenerate SDK stubs
- [x] 1.2 Prisma: enum value `STREAM`, column `protocol`; migration renames both and maps `native` to `fonoster`
- [x] 1.3 apiserver: validation (`STREAM|AUTOPILOT`, `protocol: fonoster|twilio`) with clear errors for `EXTERNAL`, `native` and `flavor`; legacy migration notices
- [x] 1.4 types and SDK: `protocol`, `STREAM`, docs and README

## 2. Runtime

- [x] 2.1 gateway: app config and AppStore read `protocol`; `src/flavors` → `src/protocols` (FonosterCodec, ProtocolCodec); config error names the rename
- [x] 2.2 region agent: snapshot column `protocol`; maps an older control plane's `EXTERNAL`/`flavor`
- [x] 2.3 session schema: error code `not_supported_by_protocol`

## 3. Tools

- [x] 3.1 CLI: `--agent`, `--protocol`, "Stream" wording, hidden old flags that name the new ones; README
- [x] 3.2 Region utility: `fonoster-region` primary, `fonoster-regions` deprecated alias
- [x] 3.3 MCP tool descriptions; voice package README

## 4. Dashboard

- [x] 4.1 `STREAM` and `protocol` in the data layer; Protocol field wired
- [x] 4.2 Agents → Autopilot (`/autopilot`), SIP users → SIP agents (`/sip-agents`), old routes redirect
- [x] 4.3 Streams mirrors Autopilot (list, create dialog, detail tabs) with its own nav icon
- [x] 4.4 "operator" for people on a transfer; "region" in user-facing copy

## 5. Specs, docs, tests

- [x] 5.1 Delta specs for requirements that name the old terms; conformance scenario refs follow
- [x] 5.2 docs/*.md and docs-site v0.30 pages
- [x] 5.3 Update tests and fixtures in every affected package; leftover-term scan
