# Running a region

A region is where calls run. A **private region** is a Fonoster data plane on your own infrastructure,
owned by your user: any of your workspaces can pick it when it is created, and one region serves
all of them (each workspace's data stays keyed by workspace). Calls, recordings, transcripts,
conversations and provider keys stay in it. The only link to Fonoster is a NATS leaf connection
that your region opens outbound (no inbound ports). Fonoster syncs your workspaces' configuration to
the region and reads call content through that link only when a member of a workspace opens a call in
the dashboard.

**Public regions** run the very same install and enroll the same way; Fonoster operators create
them with the operator key (see "Public regions" below).

Two tools, two places:

- **Dashboard** (users): create and manage private regions from the start screen.
- **`fonoster-region`** (operators): `create`, `list`, `token`, `publish` and `revoke` run
  anywhere with the operator key; `enroll`, `secrets`, `status` and `run` run on the region's
  machine.

The region runs NATS, Postgres, Routr, RTPEngine, a Roomr node, AppBridge, the hosted
Autopilot, MinIO and the **region agent**. Region operations use one utility, `fonoster-region`
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

The install command in the dashboard is a shortcut. This guide's steps (the release archive with
`compose.region.yaml`, installed with `ansible/playbooks/region.yml`) are the source of truth for
the options. User-facing steps: `docs-site/private-regions/install-region.mdx`.

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
| Enrollment | `fonoster-region enroll <token>` checks the one-time token, creates the region's key pair, gets the region's leaf credentials and stores them (files `0600` or a Kubernetes Secret). |
| Heartbeat | Every 30 s: version, Roomr nodes, appbridges, Autopilot, active calls, the **names** of the secrets set, and the config version. |
| Config sync | Applies the control plane's snapshots to the region for every workspace of the region: streams, Autopilot agents, the provider catalog and webhook endpoints into the region database; domains (under the region's SIP domain), SIP agents, trunks, ACLs and numbers into the region's Routr. A workspace that is deleted leaves the region and its config is removed from the region. Autopilot agents are pointed at the region's own Autopilot. |
| Workspace keys (public regions) | A workspace's own provider keys are fetched from Fonoster for each call over the link and never stored or logged in the region; Fonoster's keys are set on the region with `secrets set`. |
| Relay | Answers the dashboard's requests for a record or recording by reading the region's storage, in chunks. Every read is written to `relay-audit.jsonl` in the region. |
| Connection details | Reports the region's public SIP endpoints (host, port, transport), signaling and media addresses and RTP range on connect and whenever they change; the dashboard shows them (trunk form, SIP settings). Taken from `EXTERNAL_ADDRS`, `RB_SIP_PORT`, `RTPENGINE_PUBLIC_IP` and the RTP range, or set `endpoints` in `region-agent.yaml`. |
| Index and usage | Forwards each sealed call record's index entry (never contents) and the month's minutes, per workspace; records of workspaces that are not in the region are not sent. |
| Secrets | `fonoster-region secrets set <name>` stores provider keys in the region. Values never cross the link. |

## Install with the playbook

A region is the release archive (`fonoster-<v>.tar.gz`, unpacked to `fonoster/`) with
`COMPOSE_FILE=compose.yaml:compose.region.yaml`: no apiserver, dashboard or Envoy, plus the region
agent. The playbook in the archive installs it:

1. Create the region in your account area of the dashboard (id, display name, SIP domain). Copy the
   enrollment token (it is valid for 24 hours and works once). Workspaces you create afterwards
   can pick the region.
2. From the archive's `ansible` folder, with an inventory made from
   `inventory.example/region.example.yml` (the token and provider keys in the vault), plan, then
   apply:

   ```sh
   ansible-playbook -i inventory/region.yml playbooks/region.yml --check --diff --ask-vault-pass
   ansible-playbook -i inventory/region.yml playbooks/region.yml --ask-vault-pass
   ```

   It installs Docker, enrolls the region once, stores the provider keys in the region's secret
   store and starts it. The region turns **Connected** in the dashboard after the first heartbeat.

### Without Ansible

The playbook runs these commands in the unpacked `fonoster` folder:

```sh
echo "COMPOSE_FILE=compose.yaml:compose.region.yaml" >> .env
./init.sh --host-ip <the machine's public address>     # secrets, NATS passwords, keys/records.pem
docker compose run --rm --no-deps region-agent enroll <token>
docker compose run --rm --no-deps -T region-agent secrets set deepgram < deepgram.key
docker compose up -d --wait
```

`enroll` writes `region.json`, `leaf.creds`, `leaf.conf` and `cell.key` into the `region` volume.
The region's NATS includes `leaf.conf`, so NATS does not start until the region is enrolled. The
dashboard's Secrets page lists the provider key names; `secrets list` shows the ones set.

NATS users: the region gives each service its own NATS user (`NATS_*_PASSWORD` in `.env`, generated
by `./init.sh`; permissions in `config/nats-permissions/`).

## Install with Helm

The Helm chart (`ops/rebuild/helm`) is unsupported for regions.

## Firewall

| Direction | Port | Why |
| --- | --- | --- |
| Outbound | 443 (HTTPS) to the control plane URL | Enrollment only (`fonoster-region enroll`). |
| Outbound | 7422 (NATS leaf over TLS) to the control plane's region hub | Config sync, heartbeats, the call-record index and the relay. The region dials out; nothing dials in. |
| Inbound | Your SIP port(s) (5060 UDP/TCP, 5061 TLS) from your carriers and softphones | Calls. |
| Inbound | RTPEngine's UDP range from your carriers and softphones | Call audio. |
| Inbound | Envoy/dashboard ports | None: the dashboard is the control plane's. |
| Internal only | NATS 4222, Postgres 5432, MinIO 9000, AppBridge 8080, the Roomr nodes' SIP and RTP range | Keep them on the region's private network. |

Provider APIs (Deepgram, ElevenLabs, your LLM) are outbound HTTPS from AppBridge and Autopilot.

## Upgrades

Upgrades are yours: nothing changes in the region until you roll its images.

1. Read the release notes of the target version; stay within the current or previous minor release
   of the control plane (see Versions below).
2. Run the new release's `playbooks/region.yml` with the same inventory (it installs the release it
   ships in), or follow the self-hosting Upgrade page (`docs-site/self-hosting/upgrade.mdx`) in the
   region's folder. The Roomr nodes drain (calls in progress finish, up
   to `roomr.drainGraceSeconds`) and the AppBridge replicas keep in-flight sessions until they end.
3. The region agent reports the new version on its next heartbeat; the dashboard's Region page
   shows it. Config sync resumes on its own if it had paused for an unsupported version.

Enrollment, credentials and secrets survive upgrades (they live in the `region` and `secrets`
volumes).

## Operations

- **Status**: `fonoster-region status` prints the region and its control plane, then the
  applied config version, workspaces, secret names still needed and whether it was revoked. It
  never prints credentials. Read the store with the same `--data-dir` or `--k8s-secret` you
  enrolled with.
- **Secrets**: `fonoster-region secrets set|list|delete <name>`. `set` reads stdin or
  `--from-env <VAR>`. The store is a Kubernetes Secret (`--k8s-secret`), a directory
  (`--dir`) or an encrypted file (`--file`, default `<data-dir>/secrets.enc`, key in
  `FONOSTER_REGION_SECRETS_KEY`).
- **Lost the region or its credentials**: re-issue a token on the region's page and enroll
  again. Enrolling revokes the previous credentials; the agent applies the next snapshot in full.
- **Disconnect**: the region page's Disconnect revokes the region's credentials. Calls keep running on the last
  synced config until you re-enroll.
- **Missing keys**: the agent logs the names the control plane needs that the region does not have.
- **Errors at enrollment**: `token_used` (each token enrolls once; re-issue), `token_expired`
  (tokens last 24 hours; re-issue), `token_invalid` (copy the token again).
- **Versions**: keep the region within the current or previous minor release. Outside that window the
  region shows **Needs upgrade** and config sync pauses; calls keep running.

## Setting up the region hub (control plane)

`fonoster-region hub init [<dir>] --leaf-tls-cert <file> --leaf-tls-key <file>` generates, once, what
the control plane's region hub needs (also available as `fonoster-region-hub-setup` in the API
server image): `region-hub.conf` (NATS in operator mode with a leaf listener on 7422),
`keys/region-hub/{operator.seed,account.seed,control-plane.creds,system.creds}` and
`keys/region-signing.pem` (the ES256 key that signs enrollment tokens). Every file is `0600`; files
that already exist are kept, so the command is safe to run again. The leaf listener needs TLS, so the
certificate and key are required (as paths the hub's NATS server sees); `--allow-no-tls` is for local
stacks only and `--leaf-port` changes the port. The command prints the next steps: run NATS with the
config, point the API server's `regions` config (`signingKey`, `leafUrl`, `hub`) at the files, or with
Helm put them in `natsRegions.configSecret`, `apiserver.regionHubSecret` and `apiserver.keysSecret`.
Keep `keys/region-hub/` secret: the seeds mint credentials for any region.

## Public regions (operators)

Public regions are created on the cloud side with the operator key (the API server's
`regions.operatorKey`), then installed and enrolled exactly like a private region:

```sh
export FONOSTER_API_URL=https://api.fonoster.ai FONOSTER_OPERATOR_KEY=…   # never on the command line in shared shells
fonoster-region create us-east-2 --name "US East (Ohio)" [--sip-domain sip.us-east-2.fonoster.com]
# on the new location: install with playbooks/region.yml, then enroll (the playbook enrolls with
# the token in its vault; Fonoster's own provider keys go in fonoster_region.secrets)
# set `cellSecrets.workspaceKeysFromCloud: true` in the region's config/region/appbridge.yaml
# (workspaces' own keys per call)
fonoster-region publish us-east-2     # offered in pickers while it is connected
fonoster-region list [--json]         # every region (public and private) with status
fonoster-region token us-east-2       # a new token (enrolling with it revokes the machine enrolled now)
fonoster-region revoke us-east-2      # withdraw it and revoke its credentials
```

Public ids are `default` or `<geo>-<area>-<n>`. The configured `default` region of a self-hosted
or local install is always offered; an enrolled region with the same id replaces it in pickers once
it is published and connected.
