## Why

The same concept had different names on different surfaces: the API said `EXTERNAL`, the CLI said
"Your app", the dashboard said "Streams"; the wire protocol was a `flavor` with a `native` value;
SIP endpoints were "SIP users" in the dashboard and "agents" in the API; the region utility had two
names. Release 0.30 is already incompatible, so the owner decided on one name per concept
(`docs-site/CLAUDE.md` § Vocabulary) and to rename everywhere now, without backward compatibility.

## What Changes

- **BREAKING** `ApplicationType.EXTERNAL` becomes `STREAM` (proto, Prisma enum, apiserver, gateway,
  SDK, types, CLI, MCP). A stream is your own WebSocket server.
- **BREAKING** The application field `flavor` becomes `protocol`, and its value `native` becomes
  `fonoster` (`twilio` stays). Proto field, DB column, apiserver validation, gateway config and app
  loading, SDK, CLI, dashboard, conformance fixtures and docs.
- **BREAKING** CLI: `applications:create|update --assistant` becomes `--agent`, `--flavor` becomes
  `--protocol` (`fonoster|twilio`). The old flags, an old `flavor` key and `type: EXTERNAL` in a file
  fail with an error that names the new one. The agent file format is unchanged.
- The region utility is `fonoster-region`; `fonoster-regions` stays as a deprecated alias.
- Dashboard: the AI section is **Autopilot** (items stay "agent"), SIP endpoints are **SIP agents**
  (`/sip-agents`), people on a transfer are **operators**, and Streams gets Autopilot's list, create
  dialog and detail layout plus its own nav icon. Old routes redirect.
- User-facing text says "region", never "cell".
- One Prisma migration renames the enum value and the column and maps `native` to `fonoster`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `voice-session`: an app is a WebSocket URL, a **protocol** (`fonoster` or `twilio`) and speech
  defaults; framing and `session.start` are named after the `fonoster` protocol.
- `twilio-media-streams-flavor`: requirements say "the `twilio` protocol" and "stream". The
  capability id keeps its name (internal spec id; see VO-B3).
- `conformance`: the Twilio protocol suite.
- `turn-taking`, `autopilot`: the `fonoster` protocol instead of the native flavor.
- `private-regions`: the utility is `fonoster-region`; the dashboard shows "SIP agent" settings.

## Impact

- `mods/common/src/protos/applications.proto`, `mods/apiserver/schema.prisma` + migration
  `20261016100000_unify_vocabulary`, `mods/apiserver`, `mods/gateway` (`src/flavors` →
  `src/protocols`), `mods/sdk` (regenerated stubs), `mods/types`, `mods/ctl`, `mods/mcp`,
  `mods/region-agent`, `mods/conformance`, `mods/dashboard`, `docs/*.md`, `docs-site`, `ops`.
- Clients built against 0.29 that send `EXTERNAL` or `flavor` must update; this release is
  incompatible anyway.
