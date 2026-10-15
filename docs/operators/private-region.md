# Running a private region

A private region is a Fonoster cell that runs on your own infrastructure for one workspace. Calls,
recordings, transcripts, conversations and provider keys stay in it. The only link to Fonoster is a
NATS leaf connection that your cell opens outbound (no inbound ports). Fonoster syncs your
configuration to the cell and reads call content through that link only when a member of your
workspace opens a call in the dashboard.

The cell runs NATS, Postgres, Routr, RTPEngine, a media node, the VoiceSessionGateway, the hosted
Autopilot, MinIO and the **region agent** (`fonoster-region`).

## What the region agent does

| Job | How |
| --- | --- |
| Enrollment | `fonoster-region enroll <token>` checks the one-time token, creates the cell's key pair, gets the cell's leaf credentials and stores them (files `0600` or a Kubernetes Secret). |
| Heartbeat | Every 30 s: version, media nodes, gateways, Autopilot, active calls, the **names** of the secrets set, and the config version. |
| Config sync | Applies the control plane's snapshots to the cell: apps, assistants, the provider catalog and webhook endpoints into the cell database; domains, agents, trunks, ACLs and numbers into the cell's Routr. Autopilot apps are pointed at the cell's own Autopilot. |
| Relay | Answers the dashboard's requests for a record or recording by reading the cell's storage, in chunks. Every read is written to `relay-audit.jsonl` in the cell. |
| Index and usage | Forwards each sealed call record's index entry (never contents) and the month's minutes. |
| Secrets | `fonoster-region secrets set <name>` stores provider keys in the cell. Values never cross the link. |

## Install with Docker Compose

1. Create the workspace in the dashboard with **Private region**. Copy the enrollment token (it is
   valid for 24 hours and works once).
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
provider keys with `kubectl exec deploy/<release>-region-agent -- fonoster-region secrets set
deepgram --k8s-secret fonoster-region-secrets` (value on stdin), or manage the
`fonoster-region-secrets` Secret yourself (one key per provider).

## Operations

- **Status**: `fonoster-region status` shows the region, workspace, control plane and the applied
  config version. It never prints credentials.
- **Lost the cell or its credentials**: re-issue a token on the dashboard's Region page and enroll
  again. Enrolling revokes the previous credentials; the agent applies the next snapshot in full.
- **Disconnect**: the dashboard's Disconnect revokes the cell. Calls keep running on the last
  synced config until you re-enroll.
- **Missing keys**: the agent logs the names the control plane needs that the cell does not have.
- **Errors at enrollment**: `token_used` (each token enrolls once; re-issue), `token_expired`
  (tokens last 24 hours; re-issue), `token_invalid` (copy the token again).
- **Versions**: keep the cell within the current or previous minor release. Outside that window the
  region shows **Unsupported** and config sync pauses; calls keep running.
