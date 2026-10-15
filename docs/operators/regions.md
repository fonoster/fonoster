# Running a region

A region is where calls run. A **private region** is a Fonoster cell on your own infrastructure,
owned by your user: any of your workspaces can pick it when it is created, and one region serves
all of them (each workspace's data stays keyed by workspace). Calls, recordings, transcripts,
conversations and provider keys stay in it. The only link to Fonoster is a NATS leaf connection
that your cell opens outbound (no inbound ports). Fonoster syncs your workspaces' configuration to
the cell and reads call content through that link only when a member of a workspace opens a call in
the dashboard.

**Public regions** run the very same install and enroll the same way; Fonoster operators create
them with the operator key (see "Public regions" below).

Two tools, two places:

- **Dashboard** (users): create and manage private regions from the start screen.
- **`fonoster-regions`** (operators): `create`, `list`, `token`, `publish` and `revoke` run
  anywhere with the operator key; `enroll`, `secrets`, `status` and `run` run on the region's
  machine.

The cell runs NATS, Postgres, Routr, RTPEngine, a media node, the VoiceSessionGateway, the hosted
Autopilot, MinIO and the **region agent**. Region operations use one utility, `fonoster-regions`
(`fonoster-region` still works as a deprecated alias); it is not part of the `fonoster` CLI.

## Private regions from the dashboard

Private regions belong to you, not to a workspace. Sign in and open the start screen (the page
that lists your workspaces); **Your regions** is on it.

1. **New region**: enter an ID (3 to 32 lowercase letters, digits or hyphens, starting with a
   letter; `default` and the prefixes `us-`, `eu-`, `sa-`, `ap-`, `af-`, `me-` are reserved; it
   cannot change later), a display name and your SIP domain (a fully qualified name such as
   `sip.acme.com`; required).
2. The new region shows **Waiting** with its install command and enrollment token. The token works
   once and expires after 24 hours; if it expires, open the row's **More** menu and use
   **Re-issue token**.
3. Install the region on your machine (below). The status turns **Connected** after the first
   heartbeat. Other states are **Offline** (no heartbeat) and **Needs upgrade** (the version is
   outside the supported window).
4. The details drawer shows the version, last seen, SIP domain, **Connection details** (SIP host,
   port and transport, addresses to allowlist, RTP ports), the workspaces using the region, and
   which provider keys are **Set** or **Missing**. **Disconnect** revokes the region.
5. Create a workspace: its region select offers the public `default` region and your private
   regions. A workspace never changes region afterwards; Settings shows it read-only. Any of your
   workspaces can use the same private region.

The install command in the dashboard is a shortcut. This guide's steps (the `ops/rebuild/cell`
Compose files and the Helm chart) are the source of truth for the options.

## SIP domain, DNS and TLS

Every private region has a SIP domain of yours, set when you create the region (for example
`sip.acme.com`). Each workspace's SIP domains become subdomains of it in the region: the cloud's
`sales.sip.fonoster.com` is written to the region's Routr as `sales.sip.acme.com`. So:

- point wildcard DNS `*.sip.acme.com` (and `sip.acme.com`) at the region's public SIP address;
- give the region a TLS certificate for `*.sip.acme.com` (for SIP over TLS and WSS).

The region's connection details in the dashboard include the SIP domain.

## What the region agent does

| Job | How |
| --- | --- |
| Enrollment | `fonoster-regions enroll <token>` checks the one-time token, creates the cell's key pair, gets the cell's leaf credentials and stores them (files `0600` or a Kubernetes Secret). |
| Heartbeat | Every 30 s: version, media nodes, gateways, Autopilot, active calls, the **names** of the secrets set, and the config version. |
| Config sync | Applies the control plane's snapshots to the cell for every workspace of the region: apps, assistants, the provider catalog and webhook endpoints into the cell database; domains (under the region's SIP domain), agents, trunks, ACLs and numbers into the cell's Routr. A workspace that is deleted leaves the region and its config is removed from the cell. Autopilot apps are pointed at the cell's own Autopilot. |
| Workspace keys (public regions) | A workspace's own provider keys are fetched from Fonoster for each call over the link and never stored or logged in the region; Fonoster's keys are set on the region with `secrets set`. |
| Relay | Answers the dashboard's requests for a record or recording by reading the cell's storage, in chunks. Every read is written to `relay-audit.jsonl` in the cell. |
| Connection details | Reports the cell's public SIP endpoints (host, port, transport), signaling and media addresses and RTP range on connect and whenever they change; the dashboard shows them (trunk form, SIP settings). Taken from `EXTERNAL_ADDRS`, `RB_SIP_PORT`, `RTPENGINE_PUBLIC_IP` and the RTP range, or set `endpoints` in `region-agent.yaml`. |
| Index and usage | Forwards each sealed call record's index entry (never contents) and the month's minutes, per workspace; records of workspaces that are not in the region are not sent. |
| Secrets | `fonoster-regions secrets set <name>` stores provider keys in the cell. Values never cross the link. |

## Install with Docker Compose

1. Create the region in your account area of the dashboard (id, display name, SIP domain). Copy the
   enrollment token (it is valid for 24 hours and works once). Workspaces you create afterwards
   can pick the region.
2. Prepare the cell's settings and its call-record signing key:

   ```sh
   cp ops/rebuild/cell/cell.env.example ops/rebuild/cell/.env   # fill in every value
   mkdir -p ops/rebuild/cell/.local/keys
   openssl ecparam -name prime256v1 -genkey -noout \
     | openssl pkcs8 -topk8 -nocrypt -out ops/rebuild/cell/.local/keys/records.pem
   ```

3. Enroll (first step, before starting anything else):

   ```sh
   docker compose -f ops/rebuild/cell/compose.yaml run --rm --no-deps region-agent enroll <token>
   ```

   This writes `region.json`, `leaf.creds`, `leaf.conf` and `cell.key` into the `region` volume. The
   cell's NATS includes `leaf.conf`, so NATS does not start until the cell is enrolled.

4. Set the provider keys your apps need (the dashboard's Secrets page lists the names). The value is
   read from stdin:

   ```sh
   docker compose -f ops/rebuild/cell/compose.yaml run --rm --no-deps -T region-agent \
     secrets set deepgram < deepgram.key
   docker compose -f ops/rebuild/cell/compose.yaml run --rm --no-deps region-agent secrets list
   ```

5. Start the cell:

   ```sh
   docker compose -f ops/rebuild/cell/compose.yaml up -d
   docker compose -f ops/rebuild/cell/compose.yaml logs -f region-agent
   ```

   The region turns **Connected** in the dashboard after the first heartbeat.

## Install with Helm

Enable the region agent in the `fonoster-rebuild` chart:

```yaml
regionAgent:
  enabled: true
  enroll:
    token: "<token>"           # remove after the enroll Job succeeded
  identitySecret: fonoster-region
  secretsSecret: fonoster-region-secrets
  databaseSecret: fonoster-cell-db        # keys: url, key
  autopilotSecret: fonoster-cell-autopilot # key: secret
  config:
    autopilot: { url: "ws://<release>-autopilot:3000" }
autopilot:
  enabled: true                            # the cell's own Autopilot (PR-9)
gateway:
  config:
    cellSecrets: { dir: /var/lib/fonoster-secrets }
    appStore: { source: database }
    registry: { source: database }
    webhooks: { enabled: true }
    database: { urlEnv: APISERVER_DATABASE_URL, encryptionKeyEnv: APISERVER_ENCRYPTION_KEY }
```

The enroll Job writes the credentials into the `fonoster-region` Secret. Mount that Secret into your
NATS server at `/etc/nats/region` and add `include ./region/leaf.conf` to its config (NATS resolves includes relative to the including file, so the config must sit in `/etc/nats`). Set
provider keys with `kubectl exec deploy/<release>-region-agent -- fonoster-regions secrets set
deepgram --k8s-secret fonoster-region-secrets` (value on stdin), or manage the
`fonoster-region-secrets` Secret yourself (one key per provider).

## Firewall

| Direction | Port | Why |
| --- | --- | --- |
| Outbound | 443 (HTTPS) to the control plane URL | Enrollment only (`fonoster-regions enroll`). |
| Outbound | 7422 (NATS leaf over TLS) to the control plane's region hub | Config sync, heartbeats, the call-record index and the relay. The cell dials out; nothing dials in. |
| Inbound | Your SIP port(s) (5060 UDP/TCP, 5061 TLS) from your carriers and softphones | Calls. |
| Inbound | RTPEngine's UDP range from your carriers and softphones | Call audio. |
| Inbound | Envoy/dashboard ports | None: the dashboard is the control plane's. |
| Internal only | NATS 4222, Postgres 5432, MinIO 9000, the gateway 8080, the media nodes' SIP and RTP range | Keep them on the cell's private network. |

Provider APIs (Deepgram, ElevenLabs, your LLM) are outbound HTTPS from the gateway and Autopilot.

## Upgrades

Upgrades are yours: nothing changes in the cell until you roll its images.

1. Read the release notes of the target version; stay within the current or previous minor release
   of the control plane (see Versions below).
2. Compose: set the image tags (`RB_TAG`) and `docker compose -f ops/rebuild/cell/compose.yaml up -d`.
   Helm: `helm upgrade` with the new image tags. The media nodes drain (calls in progress finish, up
   to `medianode.drainGraceSeconds`) and the gateways keep in-flight sessions until they end.
3. The region agent reports the new version on its next heartbeat; the dashboard's Region page
   shows it. Config sync resumes on its own if it had paused for an unsupported version.

Enrollment, credentials and secrets survive upgrades (they live in the `region` volume or the
`fonoster-region` and `fonoster-region-secrets` Secrets).

## Operations

- **Status**: `fonoster-regions status` prints the cell's region and control plane, then the
  applied config version, workspaces, secret names still needed and whether it was revoked. It
  never prints credentials. Read the store with the same `--data-dir` or `--k8s-secret` you
  enrolled with.
- **Secrets**: `fonoster-regions secrets set|list|delete <name>`. `set` reads stdin or
  `--from-env <VAR>`. The store is a Kubernetes Secret (`--k8s-secret`), a directory
  (`--dir`) or an encrypted file (`--file`, default `<data-dir>/secrets.enc`, key in
  `FONOSTER_REGION_SECRETS_KEY`).
- **Lost the cell or its credentials**: re-issue a token on the region's page and enroll
  again. Enrolling revokes the previous credentials; the agent applies the next snapshot in full.
- **Disconnect**: the region page's Disconnect revokes the cell. Calls keep running on the last
  synced config until you re-enroll.
- **Missing keys**: the agent logs the names the control plane needs that the cell does not have.
- **Errors at enrollment**: `token_used` (each token enrolls once; re-issue), `token_expired`
  (tokens last 24 hours; re-issue), `token_invalid` (copy the token again).
- **Versions**: keep the cell within the current or previous minor release. Outside that window the
  region shows **Needs upgrade** and config sync pauses; calls keep running.

## Public regions (operators)

Public regions are created on the cloud side with the operator key (the API server's
`regions.operatorKey`), then installed and enrolled exactly like a private region:

```sh
export FONOSTER_API_URL=https://api.fonoster.com FONOSTER_OPERATOR_KEY=…   # never on the command line in shared shells
fonoster-regions create us-east-2 --name "US East (Ohio)" [--sip-domain sip.us-east-2.fonoster.com]
# on the new location: install as above, then
fonoster-regions enroll <token>
fonoster-regions secrets set deepgram < deepgram.key   # Fonoster's own provider keys
# set `cellSecrets.workspaceKeysFromCloud: true` in the gateway config (workspaces' own keys per call)
fonoster-regions publish us-east-2     # offered in pickers while it is connected
fonoster-regions list [--json]         # every region (public and private) with status
fonoster-regions token us-east-2       # a new token (enrolling with it revokes the current cell)
fonoster-regions revoke us-east-2      # withdraw it and revoke its cell
```

Public ids are `default` or `<geo>-<area>-<n>`. The configured `default` region of a self-hosted
or local install is always offered; an enrolled region with the same id replaces it in pickers once
it is published and connected.
