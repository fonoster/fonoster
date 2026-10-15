# add-private-regions build log

## 2026-10-15 (cell stream build: region agent)

### RC-B1. One package for the cell: `mods/region-agent`

- `@fonoster/region-agent` with the `fonoster-region` bin: `enroll`, `run` (the agent service),
  `status`, `secrets set|list|delete`. No new npm dependencies (Node crypto for ES256/Ed25519,
  `https` for Kubernetes, `@routr/sdk`, `nats`, `yaml`, `zod` already in the tree).
- Image: `ops/rebuild/docker/region-agent.Dockerfile`. `npm install --include-workspace-root`
  because the package is not in `package-lock.json` yet (no shared `npm install` allowed) and
  `tsc` is a root dev dependency.

### RC-B2. The token is verified on the cell before anything is sent

- The cell fetches `{cp}/.well-known/region-keys.json` (cp from the token) and checks ES256
  signature, `kid`, `aud = fonoster.region.v1`, expiry and the needed claims, so a cut or expired
  token fails locally with a clear message. The real trust anchor is TLS to the control plane:
  `cp` must be `https://` and `leaf` `tls://` unless `--allow-insecure` (or the host is local);
  `--control-plane <url>` pins the expected control plane.
- Errors map from the response's `error`/`code` text first, then the status (contract 2): 400
  `token_invalid`, 410 `token_expired`, 409 `token_used`/`workspace_deleted`, 404
  `region_not_found`; each message says what to do (re-issue on the Region page).
- The cell's Ed25519 public key is sent as the raw 32 bytes, base64url (the JWK `x`). The private
  key is kept as `cell.key` (PKCS#8 PEM, 0600); nothing uses it yet.

### RC-B3. Where the cell's NATS gets its leaf link

- Leaf ports accept only server connections, so the agent talks to the cell's own NATS and that
  server carries `region.<ref>.>` to the hub. `enroll` writes `leaf.conf` (one `leafnodes.remotes`
  entry: `leaf` URL + `credentials` path) next to `leaf.creds`; the cell's `nats.conf` includes it.
  The creds path is how NATS sees it (`--nats-creds-path`, default `/etc/nats/region/leaf.creds`).
- Not tested against a real hub in operator (JWT) mode: the tests drive the agent over a single
  NATS server with a fake control plane on the same subjects.

### RC-B4. Credentials and secrets in Kubernetes without a client library

- `KubeSecrets`: in-cluster service account token and CA, `GET`/merge-`PATCH`/`POST` on one Secret.
  `enroll --k8s-secret <name>` writes `region.json`, `leaf.creds`, `leaf.conf`, `cell.key` as keys
  of that Secret; `secrets set --k8s-secret <name>` writes one key per provider. The Helm chart's
  Role limits get/patch to those two Secret names.

### RC-B5. The cell secret store lives in `@fonoster/common` (`CellSecrets`)

- Two backends: an AES-256-GCM file (key: scrypt of `FONOSTER_REGION_SECRETS_KEY`, random salt per
  write, file 0600) for Compose, and a directory with one file per key (a mounted Kubernetes
  Secret). Names are provider ids or credential refs (`deepgram`, `groq`, `openai-default`).
- Gateway: new `cellSecrets` config. It is a workspace key source in front of the database's
  workspace keys (one workspace per private region, so the provider name picks the key); with it,
  providers need no platform credential. `Catalog.defaultStt` falls back to the first STT provider
  in the config when no platform key built one.
- Autopilot: `workspaceSecrets: { cellSecrets: {...} }`, by credentialRef, then by the providers
  using that ref.
- Heartbeats carry `names()` only; the integration test asserts no value appears on the link.

### RC-B6. Synced config lands in the apiserver's own schema in the cell

- The cell's gateway (`appStore`/`registry`/`webhooks: database`) and hosted Autopilot
  (`assistants: database`) already read the apiserver tables, so the agent writes those same
  tables with a Prisma client of the apiserver schema (no second schema). The cell has no
  apiserver, so the agent image's `run` applies the apiserver migrations first.
- Snapshot rows are taken in the apiserver's column shape (`applications` columns, `intelligence`
  {productRef, config}); the API shape (`speech: {voice, …}`, `fallback`) is accepted too. Unknown
  fields are ignored. `accessKeyId` is forced to the region's workspace. A full snapshot is
  authoritative: apps and webhook endpoints of the workspace that are missing are deleted.
- Assistants: from `kinds.assistants` (`{appRef, config, productRef?}`) or an app's
  `intelligence`. The `products` row an Intelligence needs is upserted (`llm.<provider>`).
- Catalog: `kinds.catalog` is a list of registry `CatalogEntry`s, written through
  `PrismaRegistryStore.put`; entries are not deleted (they retire).
- Snapshots apply one at a time, only when `configVersion` is newer than the applied one; a failed
  apply keeps the last version (calls keep running) and the next snapshot retries.

### RC-B7. Workspace recording policy becomes the apps' policy in the cell

- `recordingPolicy` has no table (the gateway reads workspace policies from its YAML), so the agent
  writes it into every synced app whose own `recording` is unset. Same effect: app, else workspace.

### RC-B8. Routr resources through a cp → cell ref map

- Routr makes its own refs, so the agent keeps `{kind: {cpRef: cellRef}}` in `state.json` and
  rewrites references (agent `domainRef`/`credentialsRef`, trunk ACL and credentials refs, number
  `trunkRef`, domain `accessControlListRef` and egress `numberRef`). Order: ACLs, credentials,
  trunks, numbers, domains, agents; deletes in reverse. A resource deleted by hand in the cell is
  recreated on the next snapshot.
- `routr.credentials` is not in contract 3 but is applied when sent; without it, agents and trunks
  sync without credentials (passwords are secrets; RC-B9).
- The cell has no apiserver, so the agent also creates the media-node peer in the cell's Routr
  (`routr.mediaNodePeer`, password from env), as the apiserver does in a public region.

### RC-B9. Secrets that are not provider keys

- App signing secrets and webhook endpoint secrets are taken from the snapshot when present (they
  are app/endpoint secrets the user already holds, not provider keys). When a snapshot has none,
  the cell keeps the one it has or generates one and logs a warning. Autopilot apps get the cell's
  Autopilot URL and signing secret (PR-9), never the control plane's.

### RC-B10. Relay details the contract leaves open

- Ops: `record.get` replies with JSON `{callRef, version, redacted, vcon, jws, parts}` (like the
  records API); `record.part` takes a role (`recording`) or a part name, and only parts the chosen
  copy references are served (the redacted copy withholds the recording). Additive request fields:
  `original` (the cp sets it when the user may read originals) and `version`.
- `range`: `{start, end}` (end inclusive) or `bytes=a-b`.
- Chunks are 380 KB of raw bytes so each JSON message stays ≤ 512 KB after base64; all chunks go
  to the request's reply subject in order with `seq` and `last`. Failures are one chunk with
  `last: true` and an additive `error` (`not_found`, `contents_deleted`, `bad_range`, …).
- Every read (or refusal) is appended to `relay-audit.jsonl` in the state dir: time, request id,
  userRef, op, callRef, part, bytes, result.

### RC-B11. Agent state, config requests and re-enrollment

- `state.json` (0600): applied config version, Routr ref map, needed secret names, usage, revoked.
  A new enrollment (different token id) re-applies the next snapshot in full and clears `revoked`;
  a different region starts over.
- `region.config.request` is sent on start, on every NATS reconnect, and retried every 10 s until a
  reply; `haveVersion` is `-1` before the first snapshot.
- `region.revoked` stops heartbeats and is persisted; calls keep running on the last config.

### RC-B12. Components, calls and usage

- Media nodes: `media.*.heartbeat` seen in the last 10 s. Gateways had no liveness signal, so the
  gateway now publishes `gateway.heartbeat` `{gatewayRef, calls}` every 5 s (small addition in
  `Gateway.start`). Active calls = the gateways' calls (else the nodes' rooms). Autopilot = a TCP
  probe of its URL.
- Index: `callrecord.sealed` from the cell's gateways is republished on `region.R.index` with
  `workspaceRef` set to the region's workspace. Usage: per call, minutes rounded up, summed by
  month (UTC) and published on `region.R.usage` after each entry and at start.

### RC-B13. Packaging

- Compose: `ops/rebuild/cell/compose.yaml` (+ `cell.env.example`, `config/`): NATS with the leaf
  include, Postgres, Routr, RTPEngine, media node, gateway, Autopilot, MinIO, region agent.
  `enroll` is the first step (`run --rm --no-deps region-agent enroll <token>`); NATS will not start
  before it (the include must exist).
- Helm: `regionAgent` values and `templates/region-agent.yaml` (ServiceAccount + Role, enroll Job
  when a token is set, agent Deployment with the identity Secret mounted and an emptyDir state);
  the gateway mounts the cell secrets Secret when `regionAgent.enabled`. The chart had no Autopilot,
  so `autopilot` values and `templates/autopilot.yaml` were added (off by default; cell secrets
  mounted when `regionAgent.enabled`).
- Operator guide: `docs/operators/private-region.md`.

### RC-B14. Webhooks from the cell (task 3.4)

- Nothing new to build: the cell's gateway already delivers webhooks from `webhook_endpoints`
  (`webhooks.enabled`), which the agent syncs.
