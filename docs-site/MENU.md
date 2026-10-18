# v0.30 menu plan

The agreed menu (2026-10-15). A page joins `docs.json` only once it exists. Each page has one
Diátaxis type: T tutorial, H how-to, R reference, E explanation. ★ = next up.

## Docs (developers)

| Group       | Page                            | Type | Path                          |
| ----------- | ------------------------------- | ---- | ----------------------------- |
| Get started | Introduction                    | E    | `introduction`                |
|             | Quickstart                      | T    | `quickstart`                  |
|             | How Fonoster works              | E    | `concepts/how-fonoster-works` |
| Build       | Autopilot agents                | H    | `build/autopilot`             |
|             | Streams (SDK)                   | H    | `build/streams`               |
|             | Bring your Twilio/Pipecat app   | H    | `build/bring-your-app`        |
|             | Webhooks                        | H    | `build/webhooks`              |
|             | Call records and recordings     | H    | `build/call-records`          |
|             | Turn-taking                     | E    | `build/turn-taking`           |
| Telephony   | Numbers                         | H    | `telephony/numbers`           |
|             | SIP trunks                      | H    | `telephony/trunks`            |
|             | Agents                          | H    | `telephony/agents`            |
|             | Outbound calls                  | H    | `telephony/outbound-calls`    |
| Reference   | API                             | R    | `reference/api`               |
|             | SDK                             | R    | `reference/sdk`               |
|             | CLI                             | R    | `reference/cli`               |
|             | Providers catalog               | R    | `reference/providers`         |

## Self-hosting

| Group     | Page                         | Type | Path                                |
| --------- | ---------------------------- | ---- | ----------------------------------- |
| Start     | Overview and requirements    | E    | `self-hosting/overview`             |
|           | Make your first call ★       | T    | `self-hosting/first-call`           |
|           | Install with Docker Compose ✓| T    | `self-hosting/install-compose`      |
| Operate   | Configure services           | H    | `self-hosting/configure`            |
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
