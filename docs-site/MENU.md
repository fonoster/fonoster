# v0.30 menu plan

The agreed menu (2026-10-15). A page joins `docs.json` only once it exists. Each page has one
Diátaxis type: T tutorial, H how-to, R reference, E explanation. ★ = next up.

## Docs (developers)

Revised 2026-10-19 after studying Vapi, LiveKit, Daily/Pipecat and QCobro docs plus the v0.30 code.
One Docs tab with groups; Self-hosting, Private regions and Hacking are sections inside it, and SDK, CLI and Changelog are tabs (owner decisions, 2026-10-19). WHY = the reason the page exists; Src = material to adapt.

| Group | Page | Type | Path | WHY | Src |
| --- | --- | --- | --- | --- | --- |
| Get started | Introduction ★ | E | `introduction` | One screen: what Fonoster is, Autopilot vs Streams, where self-hosters and contributors go | placeholder |
| | Quickstart: your first AI call | T | `quickstart` | A number answers within ~5 minutes; Dashboard / SDK / CLI tabs per step | `docs/try-the-new-platform.md` |
| | How Fonoster works | E | `concepts/how-fonoster-works` | Mental model: workspace → number → application → Autopilot or stream; regions | protos, legacy concepts |
| | Migrate from 0.27 | H | `migrate-from-0-27` | Renamed and removed fields (`EXTERNAL→STREAM`, `vad`, `eventsHook`…) | `docs/migrating-to-sessions.md` |
| Autopilot | Build an Autopilot agent | H | `autopilot/build-an-agent` | The main product: prompt, messages, voice, language, idle, max duration | `docs/autopilot.md` |
| | Give your agent tools | H | `autopilot/tools` | hangup, transfer and HTTP tools (no MCP tools yet) | `sessionAssistantSchema.ts` |
| | Add a knowledge base | H | `autopilot/knowledge-base` | Grounded answers; S3 only, 800 ms lookup cap | `docs/autopilot.md` |
| | Test your agent | H | `autopilot/test` | Talk in the browser, `testCases`, `applications:eval` | eval spec, `mods/ctl` |
| | Write prompts for voice | H | `autopilot/prompting` | Voice prompts differ from chat | `legacy/guides/prompting-guide` |
| | Turn-taking and barge-in | E | `autopilot/turn-taking` | EoT over endpointing; `patience`, `allowUserBargeIn` | `docs/turn-taking.md` |
| Streams | Build a stream with the Voice SDK | T | `streams/voice-sdk` | Your own logic: say, gather, transfer in Node | `docs/voice-sdk.md` |
| | Use the Python Voice SDK | H | `streams/python` | Python is the AI-dev default (ASGI mounting) | `python/fonoster-voice` |
| | Bring your Twilio or Pipecat app | H | `streams/bring-your-app` | Run an unmodified Pipecat or Media Streams bot | migrating-to-sessions §4, `python/pipecat-golden` |
| | Verify request signatures | H | `streams/verify-signatures` | Every stream server must check `x-fonoster-*` headers | migrating-to-sessions §3 |
| Telephony | Numbers and routing | H | `telephony/numbers` | Shared by both paths, so it gets its own group | sipnet protos |
| | Link a Twilio number | H | `telephony/link-twilio` | Fastest way to a real number | legacy guide, `mods/ctl` |
| | Connect a SIP trunk | H | `telephony/trunks` | Bring your own carrier | `legacy/guides/linking-any-virtual-number` |
| | SIP agents (softphones) | H | `telephony/sip-agents` | Test phones and operator phones | sipnet |
| | Make outbound calls | H | `telephony/outbound-calls` | `createCall`, batches via MCP | Calls API, `mods/mcp` |
| | Transfer calls | H | `telephony/transfers` | Cold, warm, refer | voice SDK, `transferOptions` |
| | DTMF | H | `telephony/dtmf` | IVRs and PINs: gather digits, `playDtmf`, `initialDtmf` | voice SDK |
| | Detect answering machines | H | `telephony/amd` | App `amd` setting and the `amd.result` event | voice-session spec |
| | Record calls and ask for consent | H | `telephony/recording` | Policy off/on/consent and its precedence | `docs/call-records.md` |
| Observe | Webhooks | H | `observe/webhooks` | Events, signing, retries, resend | `docs/webhooks.md` |
| | Call records (vCon) | H | `observe/call-records` | Signed, verifiable records: fetch, recording, verify | `docs/call-records.md` |
| | Retention and erasure | H | `observe/retention` | Privacy requests; SDK and HTTP only | `docs/call-records.md` |
| Workspace | Workspaces, members and API keys | H | `workspace/access` | Every API call needs it | identity, legacy concepts |
| | Use your own provider keys | H | `workspace/provider-keys` | Bring your own Deepgram, OpenAI, ElevenLabs, Groq keys | `docs/providers.md` |
| | Secrets | H | `workspace/secrets` | Credentials for tools without hardcoding | secrets proto |
| | Use Fonoster from an AI assistant (MCP) | H | `workspace/mcp` | Claude or Cursor place calls through `fonoster-mcp` | `mods/mcp` |
| Reference | API | R | `reference/api` | Short: gRPC, use the SDK, link to `@fonoster/sdk` on npm (owner decision) | protos |
| | Node SDK | R | `reference/sdk` | The SDK gets its own home | `mods/sdk` |
| | Voice SDK (Node and Python) | R | `reference/voice-sdk` | Methods, events, options | `docs/voice-sdk.md` |
| | Session protocol | R | `reference/session-protocol` | For clients in other languages | `docs/session-protocol.md` |
| | Twilio compatibility | R | `reference/twilio-compatibility` | Which Media Streams messages work | twilio flavor spec |
| | Autopilot configuration | R | `reference/autopilot-config` | Every field, default and limit | assistant schema |
| | Webhook events | R | `reference/webhook-events` | Payload per event | `docs/webhooks.md` |
| | CLI | R | `reference/cli` | Developer commands | `mods/ctl` |
| | Providers and models | R | `reference/providers` | Catalog and deprecations | `ops/bundle/config/catalog.yaml` |

Not built, so never promised: MCP or code tools in Autopilot, Anthropic/Google models on live calls,
number import, billing, logs, SDK record/mute, dashboard or CLI for retention, a per-app turn-taking
detector.

## Self-hosting

| Group     | Page                         | Type | Path                                |
| --------- | ---------------------------- | ---- | ----------------------------------- |
| Start     | Overview and requirements    | E    | `self-hosting/overview`             |
|           | Make your first call ★       | T    | `self-hosting/first-call`           |
|           | Install with Docker Compose ✓| T    | `self-hosting/install-compose`      |
| Operate   | Configure services           | H    | `self-hosting/configure`            |
|           | Manage the provider catalog  | H    | `self-hosting/provider-catalog`     |
|           | Rotate call-record keys      | H    | `self-hosting/call-record-keys`     |
|           | Tune turn-taking and audio   | H    | `self-hosting/turn-taking-and-audio`|
|           | Add providers and keys       | H    | `self-hosting/providers`            |
|           | First workspace and API key  | H    | `self-hosting/first-workspace`      |
|           | Secure it (TLS, ports)       | H    | `self-hosting/secure`               |
|           | Kubernetes with Helm         | H    | `self-hosting/helm`                 |
|           | Upgrade from 0.27            | H    | `self-hosting/upgrade-from-0-27`    |
|           | Troubleshooting              | H    | `self-hosting/troubleshooting`      |
| Integrations | Send call metrics to ClickHouse | H | `self-hosting/send-call-metrics-to-clickhouse` |
|           | Send telemetry               | H    | `self-hosting/send-telemetry`       |
| Tooling   | Stack installer              | R    | `self-hosting/tooling/stack`        |
|           | `fonoster` CLI for operators | R    | `self-hosting/tooling/cli`          |
|           | Helm chart values            | R    | `self-hosting/tooling/helm-values`  |
|           | Configuration reference      | R    | `self-hosting/tooling/configuration`|

## Private regions

| Group   | Page                         | Type | Path                                  |
| ------- | ---------------------------- | ---- | ------------------------------------- |
| Start   | What a private region is     | E    | `private-regions/overview`            |
|         | Requirements                 | R    | `private-regions/requirements`        |
| Operate | Enroll a region              | H    | `private-regions/enroll`              |
|         | Operate and monitor          | H    | `private-regions/operate`             |
|         | Revoke or move a region      | H    | `private-regions/revoke`              |
|         | Troubleshooting              | H    | `private-regions/troubleshooting`     |
| Control plane | Host private regions   | H    | `private-regions/host-private-regions` |
| Tooling | `fonoster-region` CLI        | R    | `private-regions/tooling/cli`         |
|         | Region bundle (Compose)      | R    | `private-regions/tooling/region-bundle` |

## Changelog

`changelog` (v0.30 onward). The legacy changelog stays at `legacy/changelog`.

## Hacking Fonoster

The dev container is the only way to develop Fonoster (owner, 2026-10-16). Dependencies run as containers;
our components run from source with reload.

| Group      | Page                          | Type | Path                          |
| ---------- | ----------------------------- | ---- | ----------------------------- |
| Start      | Overview                      | E    | `hacking/overview`            |
|            | Run Fonoster from source      | T    | `hacking/run-from-source`     |
| Components | Work on the API server        | H    | `hacking/apiserver`           |
|            | Work on the gateway           | H    | `hacking/gateway`             |
|            | Work on Autopilot             | H    | `hacking/autopilot`           |
|            | Work on the Roomr node        | H    | `hacking/roomr`           |
|            | Work on the dashboard         | H    | `hacking/dashboard`           |
| Contribute | Run the tests                 | H    | `hacking/tests`               |
|            | Contributing                  | H    | `hacking/contributing`        |
