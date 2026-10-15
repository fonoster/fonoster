# Build log: add-private-regions

## regui (dashboard) decisions

- RU-B1. Dashboard codes against `RegionsApi` (mods/dashboard/src/regions/types.ts) with a mock and an SDK stub (`sdk-api.ts`). Assumed shapes for the coordinator to wire:
  - `listRegions()` -> `sdk.regions.listRegions()` `{items:[{id,name}]}`; falls back to `[us-east-1]` on any failure.
  - `createWorkspace({name, region})` -> `sdk.workspaces.createWorkspace({name, region})` where `region` is a public id or the literal `"private"`; response `{ref, enrollmentToken?, expiresAt?}`.
  - `getRegion()` -> `sdk.workspaces.getRegion()` returning `Region` (ref, kind, name, status, version, lastHeartbeatAt ISO, mediaNodes, gateways, activeCalls, enrolledAt, unsupportedReason, secrets:[{name, usedBy[], set}]). `secrets` merges `region.R.secrets.needed` with the heartbeat's `secretsSet`.
  - `reissueRegionToken()` -> `{enrollmentToken|token, expiresAt}`; `disconnectRegion()` -> void (status back to `waiting`).
- RU-B2. `Workspace.region` is assumed on the workspace object (string; `rg_...` means private). Read through a cast until `@fonoster/types` adds it. Existing workspaces default to `us-east-1`.
- RU-B3. The enrollment token is shown only when issued: create passes it to `/w/:ref/region-setup` through router state; on reload the page offers "Re-issue token". `getRegion()` never returns the token.
- RU-B4. Install commands are built client-side: `FONOSTER_ENROLLMENT_TOKEN=<t> docker compose -f fonoster-region.yml up -d` and `helm install fonoster-region fonoster/region --set enrollment.token=<t>`. File/chart names are placeholders to match the cell stream.
- RU-B5. Polling: setup page every 3 s, everywhere else 30 s (react-query). Only private workspaces fetch.
- RU-B6. `region-setup` is a hidden route (not in the sidebar). Settings gets a Region tab for all workspaces (public is read-only).
- RU-B7. No Billing page exists in this dashboard yet, so the flat-fee line (PR-11) is a note in Settings → Region, shown only when `capabilities.billing.enabled` (hidden in self-hosted). Revisit when Billing returns.
- RU-B8. Create-workspace now always sends `region` (public default `us-east-1`); the existing landing test was updated. Private choice has a confirm step.
- RU-B9. Offline call detail hides turns, decisions and the recording button and shows metadata only; `unsupported` shows a banner but content still opens (relay still works).
- RU-B10. Designs were not inspected through the Pencil MCP (speed); UI follows the spec and existing component patterns, so a visual fidelity pass against designs/dashboard.pen "Regions" is still open.

## regcp (control plane) decisions

- RG-B1. **Where things live.** `Workspace.region` is an Identity column (`us-east-1` default, migration pins existing workspaces; a private workspace stores its `rg_…` ref). Region rows, tokens, credentials and usage are control-plane tables in the apiserver DB (`regions`, `region_tokens`, `region_credentials`, `region_usage`). Identity reaches the control plane through `IdentityConfig.regions` hooks (create private region, retire it on workspace delete); create-then-insert, with the region retired if the workspace insert fails. `UpdateWorkspace` with a different `region` answers `FAILED_PRECONDITION region_immutable`.
- RG-B2. **NATS credentials: a separate region hub in decentralized-JWT (operator) mode.** Cells link as leaf nodes to `nats-regions` (operator + SYS + REGIONS accounts, full resolver), not to the main NATS, which stays anonymous and unchanged. On enrollment the control plane mints a fresh user nkey and a user JWT signed by the REGIONS account key with pub/sub allow `region.<ref>.>` only, and returns it as a creds file. Revocation = re-sign the REGIONS account JWT (operator key) with `revocations{userKey: now}` and push it over a SYS-account connection (`$SYS.REQ.CLAIMS.UPDATE`); the hub disconnects the user and refuses it after. Verified against nats 2.11.8 as client and as a leaf node (scoping holds both ways). `nkeys.js` was already in node_modules (nats.js depends on it); the JWT encoding is ~100 lines vendored in `regions/natsJwt.ts` (no `@nats-io/jwt`). Rejected: auth callout (more moving parts, leaf support uncertain on 2.11), config-file users (needs reloads).
- RG-B3. The control plane connects to the hub with its own unrestricted REGIONS user, so heartbeats, config, relay, index and usage never touch the main NATS. Index entries from `region.R.index` go through the records index code with `workspaceRef` and `region` forced to the region's.
- RG-B4. **Contract additions** (contract.md, additive): reply subjects under `region.R._INBOX.>` (the cell's link client needs `inboxPrefix: "region.R._INBOX"` for config requests), `region.relay.error`, `region.config.paused`, relay `original`/`version`, snapshot field shapes.
- RG-B5. The cell's Ed25519 `publicKey` is recorded (`cell_public_key`) but the NATS user is a control-plane-generated nkey, because the creds file must carry its seed.
- RG-B6. Config snapshots carry Fonoster-generated secrets the cell needs to work: app session signing secrets (gateway) and webhook signing secrets (delivery from the cell). Provider keys are never sent; `secrets.needed` lists provider ids (`deepgram`, `groq`, …) from app voices/STT models (with the gateway defaults) and assistant LLMs.
- RG-B7. Change detection: write handlers (`create|update|delete|rotate|regenerate|resend*`) of Applications, Numbers, Domains, Agents, Trunks, Acls, Credentials and Webhooks are wrapped so success marks the workspace changed; retention PUT/DELETE too. Changes are debounced (500 ms) into one `configVersion`. Global catalog edits do not trigger a push (they reach cells on the next change or request). A heartbeat behind the current version gets the snapshot resent with the same version.
- RG-B8. Status is computed on read from the row (no sweeper): `waiting` also covers an enrolled cell's first 2 minutes without a heartbeat. Window = current and previous minor of the apiserver's package version (`regions.currentVersion` overrides).
- RG-B9. Region APIs are HTTP on the bridge (like records): `GET /api/regions`, `GET /api/regions/current`, `POST /api/regions/current/token|disconnect` (owner/admin), `POST /api/regions/enroll`, `GET /.well-known/region-keys.json` (Envoy route added). SDK: `new SDK.Regions(client)` plus `workspaces.getRegion() / reissueRegionToken() / disconnectRegion()`; `createWorkspace({name, region})` returns `{ref, region, enrollmentToken?, expiresAt?}`. `getRegion()` returns the dashboard's `Region` shape (RU-B1: kind, name, status, mediaNodes, gateways, unsupportedReason, secrets[{name, usedBy, set}]) plus raw fields; a public workspace gets `{kind:"public", status:"connected"}`.
- RG-B10. Relay: streamed chunk by chunk to the HTTP response (reordered by `seq`), 5 s for the first chunk (`503 region_offline`), 10 s between chunks, 256 MB cap, 8 relays in flight per region (`429 rate_limited`). The browser leaving stops the relay. Only GET record and GET recording relay for private workspaces; erase/delete-part stay on the existing paths (open).
- RG-B11. Local stack: `fonoster-region-hub-setup` (apiserver bin) generates the hub config, seeds, creds and the ES256 region-signing key; `ops/rebuild/stack up` runs it and renders `regions:` into fonoster.yaml; `nats-regions` is a new profile (`regions`, on by default) with the leaf port on `${RB_LEAF_PORT:-7422}` and plain `nats://` (`allowInsecureLeaf`). Production needs `--leaf-tls`.
- RG-B12. Tests: `test/regions/units.test.ts` and `test/regions/regions.test.ts` (fake cell: enroll, config request, heartbeat, status, index, usage, relay, re-issue, disconnect, delete) on Postgres + NATS; `REGION_HUB_TEST=1` runs the same against a real hub container (`rb-regcp-hub`, port 21422) and adds scoping and revocation checks.

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
- Checked against a real operator-mode hub (nats 2.11.8, the control plane's `natsJwt` material,
  a user scoped to `region.<ref>.>`): the cell's NATS links as a leaf, the agent's config request
  (with the inbox prefix) gets its reply, heartbeats arrive, a relay with the control plane's
  `region.<ref>._INBOX.<id>` reply subject round-trips, and local subjects (`media.*`, `gateway.*`,
  others) do not leak to the hub. NATS resolves `include` relative to the including file, so the
  cell's `nats.conf` uses `include ./region/leaf.conf`.

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

### RC-B7. Recording policy in the cell

- The control plane sends `recordingPolicy` as `{transcripts, recordings, retention: [{part,
  days}]}` (RG-B4): retention replaces the workspace's `call_record_retention` rows in the cell.
  The feature flags are not applied (the cell's gateway YAML holds those). A plain string
  (`off|on|consent`) is still accepted and fills synced apps whose own `recording` is unset.

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
  to the request's reply subject in order with `seq` and `last`. Failures answer once with
  `{type: "region.relay.error", id, code}` (RG-B4): `not_found`, `contents_deleted`,
  `permission_denied` (a part the redacted copy withholds, like the records API), `bad_range`, ….
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

### RC-B15. Aligned with the control plane's contract additions (RG-B4)

- The agent's NATS client uses `inboxPrefix: "region.<ref>._INBOX"`, so the reply to
  `region.<ref>.config.request` comes back through the leaf (the cell's user may only use
  `region.<ref>.>`). The relay replies go to the control plane's `region.<ref>._INBOX.<id>` as given.
- `region.config.paused` (unsupported version) is logged with the required version, keeps the last
  config, and the request is retried every minute.
- Tests: the cell test's link client uses the prefix and checks the reply subject; a second test
  covers `region.config.paused`.
