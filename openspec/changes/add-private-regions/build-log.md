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

## regep (region endpoints) decisions

- RE-B1. **Storage.** Three additive columns on `regions` (`endpoints` JSONB, `endpoints_hash`, `endpoints_at`; migration `20261015400000_region_endpoints`). The control plane stores a cleaned copy (bad hosts/ports/transports dropped) with its own `updatedAt`. Enrolling or disconnecting clears the hash so the next cell's first heartbeat asks again; the old details stay visible until replaced.
- RE-B2. **Asking for them.** Contract addition: `endpointsHash` is the region agent's hash (RC-B16: sha256 of the fields in send order, 16 hex), computed by the cp on the message as received; and `region.R.endpoints.request` (cp → cell, plain publish, not request/reply, so no inbox crosses the link). The cp asks after a heartbeat whose hash differs from the stored one, or has no hash while nothing is stored.
- RE-B3. **Public regions** carry `endpoints` in `regions.public[]` (fonoster.yaml, validated). The local stack renders us-east-1 with this machine's address: Routr's published SIP port over UDP and TCP, and RTPEngine's range (`RTPENGINE_PORT_MIN..MAX`). `regions:` is now always rendered; the hub fields are appended only when the hub exists.
- RE-B4. `GET /api/regions/current` (and so `sdk.regions.getRegion()` / `sdk.workspaces.getRegion()`) returns `endpoints`; `@fonoster/types` gains `RegionEndpoints`. A public workspace still gets the default public region's view (one public region, PR-10); look the workspace's own region up once there is a second one.
- RE-B5. **Dashboard wiring.** `createSdkRegionsApi` now calls the real SDK (`sdk.regions` added to the dashboard's SDK bundle; `createWorkspace({name, region})`), maps the SDK view to the dashboard `Region`, keeps the us-east-1 fallback for `listRegions`. The mock stays for tests and stories. `useRegion` now loads for public workspaces too (once, 5 min stale; only private regions poll).
- RE-B6. **UI (minimal).** Settings → Region: "Connection details" with one copy field per SIP endpoint ("SIP (TLS)": host:port), "Addresses to allowlist" (signaling and media, merged), "RTP ports"; a private region without reports says "Shown once your region connects." The trunk form adds one line under Inbound ("Point your carrier at host:port (UDP); allowlist …"), preferring UDP, then TCP, then TLS. The SIP user drawer adds "Softphone settings": Server, Port, Transport (UDP first, then TCP, TLS, WSS, WS). Nothing shows when no details are known.
- RE-B7. **Against the real agent** (after merging regcell). The cp hashes like the agent (RE-B2), so a steady cell never gets asked. The agent now also answers `region.R.endpoints.request` by re-publishing (small additive edit in `mods/region-agent/src/agent.ts` and `types.ts`). `test/regions/regions.test.ts` runs a real `RegionAgent` against the cp: endpoints stored, hashes equal, no requests while steady, a foreign hash triggers a fresh report (skipped with `REGION_HUB_TEST=1`, where the agent's media/gateway subscriptions are outside the creds).
- RE-B8. Known unrelated failures on this checkout (also on d97b23f30): the DB webhook-delivery tests in `common/test/persistence/prisma.test.ts` (registry `provider.deprecated`) and `gateway/test/apps.test.ts` (`call.started` from the database endpoint).

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

### RC-B16. Connection details (`region.endpoints`, task 3.6)

- The agent sends `region.R.endpoints` on start, after each NATS reconnect, and whenever the
  details change (checked before each heartbeat); heartbeats carry `endpointsHash` (sha256 of the
  canonical fields, 16 hex chars). `updatedAt` is when they last changed.
- Values: the agent config's `endpoints` (each set field wins), else the environment the cell's
  services use: `EXTERNAL_ADDRS` (signaling addresses and the SIP host; `ROUTR_SIP_HOST`
  overrides the host), `ROUTR_SIP_PORT`/`RB_SIP_PORT` (default 5060), `ROUTR_SIP_TRANSPORTS`
  (default `udp,tcp`), `RTPENGINE_PUBLIC_IP` (else `MEDIANODE_RTP_ADVERTISE`, else
  `EXTERNAL_ADDRS`) and `RTPENGINE_PORT_MIN/MAX` (else `MEDIANODE_RTP_PORT_MIN/MAX`). Compose
  passes those to the agent; on Kubernetes set `regionAgent.config.endpoints` (the pod cannot see
  the load balancer's address). Nothing known: no message, no hash.

### RC-B17. Real round trip against the `ops/rebuild` stack (2026-10-15)

- Control plane: `ops/rebuild/stack up` with the `regions` profile (ports 22xxx). Cell: its own NATS
  container linked as a leaf to `nats-regions`, the agent on the host, a fresh cell database.
  Steps and results: `createWorkspace({region: "private"})` returned a token → `enroll` → region
  `connected` (nodes 1, gateways 1) → creating an app in the workspace reached the cell database
  (config v1 → v2, catalog entries included) → a `callrecord.sealed` on the cell's NATS was indexed
  → `GET /api/records/<call>/recording?original=true` streamed 700 KB from the cell byte-for-byte;
  `GET /api/records/<call>` returned the redacted vCon; the redacted recording answered 403
  `permission_denied`; four reads in the cell's audit log.
- Found: the first snapshot requests failed while Routr's API was still starting (the control
  plane answered "Internal server error" to config requests and heartbeats); the agent's retry
  covered it. The token's `leaf` is the host's LAN address, which a container on Docker Desktop
  reaches as `host.docker.internal`.


## rgapi (rework to PR-12..PR-21) decisions

- RW-B1. **Data model.** `regions` gains `id`, `kind` (public|private), `owner_ref`, `display_name`, `sip_domain`, `published`; `access_key_id` is legacy (nullable, used once for the owner backfill). Id uniqueness is two partial unique indexes on live rows: `(owner_ref, id)` for private, `id` for public, so a deleted region frees its id. Migration `20261015600000_user_regions`; `region_usage` gets `access_key_id` in its key.
- RW-B2. **What `Workspace.region` holds.** The id for a public region (`default`, `us-east-2`) and the `rg_…` ref for a private one (private ids are only unique per owner). CreateWorkspace accepts a private region by id or ref and stores the ref. Identity migration `20261015600000_default_region` moves `us-east-1` to `default` and makes `default` the column default.
- RW-B3. **Owner backfill across databases.** Identity has its own database, so the old private regions' owner is not set in SQL: at start the API server sets `owner_ref` from the workspace's owner through Identity's workspace directory (`migrateLegacyOwners`). Old regions get id `private-<ref suffix>` and display name "Private region".
- RW-B4. **Identity ↔ regions.** The hooks are now `resolveRegion(ownerRef, requested)` (an offered public id, or one of the caller's private regions; anything else, `"private"` included, is `INVALID_ARGUMENT`), `workspaceChanged({accessKeyId, region})` (create and delete resync that region) and `attachDirectory(...)`: Identity hands the control plane `workspace(accessKeyId)` and `inRegion(key)` over its own Prisma client. Deleting a workspace no longer touches the region (it belongs to the user).
- RW-B5. **User API is HTTP on the bridge, user-level.** `POST/GET /api/regions`, `GET|PATCH|DELETE /api/regions/:region`, `POST /api/regions/:region/token|disconnect`; `:region` is the id or ref; the Bearer token's `sub` is the owner (no `x-accesskey-id`). Someone else's region answers 404. `GET /api/regions` needs no auth for the public list and adds the caller's regions when a token is sent. `GET /api/regions/current` stays (workspace-scoped, any member). The old `/api/regions/current/token|disconnect` are gone.
- RW-B6. **Ids.** `current`, `enroll` and `admin` are reserved too (route words). Public ids are `default` or `<geo>-<area>-<n>`. SIP domains are lowercased and a trailing dot dropped; wildcards, single labels and numeric TLDs are refused.
- RW-B7. **Operator key (PR-19).** `regions.operatorKey` (min 16 chars, `secret://` resolved by the config loader) in header `x-operator-key`, compared in constant time. No key configured: the admin API answers 404. Admin routes live under `/api/admin/regions` (Envoy's `/api` route covers them). `revoke` = unpublish + revoke the cell's credentials (workspaces stay bound; re-issue a token to bring it back).
- RW-B8. **Pickers.** Offered public regions = the configured ones (always, as connected) + rows that are published and `connected` or `degraded`. A row with a configured id replaces the configured entry while offered; workspaces bind to the id either way. The startup log says so.
- RW-B9. **Snapshots** (contract §3): `{region:{ref,id,kind,sipDomain,rootDomain}, catalog, workspaces:{<accessKeyId>:{ref,name,domain,kinds}}}`; the catalog is shared. Changes debounce per workspace and per region key; a workspace joining or leaving bumps the version. `secrets.needed` carries the union and `workspaces:{id:[names]}`; with several workspaces `usedBy` reads "Workspace: App".
- RW-B10. **Checks (PR-14).** Index entries and usage must name a workspace bound to the region (`serves`), else they are dropped; the cp no longer forces the workspace. Relays carry `workspaceRef` and only run for records whose index row came from that region (`row.region === ref`), which also covers enrolled public regions.
- RW-B11. **BYO keys (PR-20).** `region.R.secrets.get` answers only an enrolled public region and a bound workspace, reading `workspace_provider_keys` → Secret uncached; the value is only in the reply. Private regions get `not_public`.
- RW-B12. **Domains (PR-16).** `<label>.<rootDomain>` → `<label>.<sipDomain>` (`regionDomainUri`, same rule as the agent, RW-B21); the region view's `workspaces[].domain` / `workspaceDomain` and `endpoints.sipDomain` show it.
- RW-B13. **API shapes for the dashboard (RD-B*).** Create and re-issue return `{token, enrollmentToken, expiresAt}` (+ `ref, id` on create). List items: `{ref?, id, name, displayName, kind, default, status, state, sipDomain?, workspaces?, published?}`. `Region` adds `id, displayName, sipDomain, ownerRef, lastSeenAt (= lastHeartbeatAt), workspaces:[{ref, accessKeyId, name, domain}], workspaceDomain, monthlyFeeCents` (`regions.privateRegionMonthlyFeeCents`, null when unset or public). SDK: `sdk.regions.listRegions()` → `{items}` (the dashboard tolerates it), `createRegion({id, displayName, sipDomain})`, `getRegion(region?)` (no argument = current workspace), `updateRegion(region, {displayName})`, `reissueRegionToken(region?)`, `disconnectRegion(region?)`, `deleteRegion(region)`; `workspaces.createWorkspace({name, region})` → `{ref, region}` (no token any more).
- RW-B14. **Local stack.** The configured region is `default` ("Local (this machine)"); `stack up` generates `config/keys/region-operator.key` and renders `regions.operatorKey: secret://file/opt/fonoster/keys/region-operator.key`. The seed creates no region (workspaces land on `default`).
- RW-B15. Tests: `regions/units.test.ts` (ids, domains, config) and `regions/regions.test.ts` rewritten (user API, two workspaces in one region, snapshot keys and domains, workspace join/leave, index/usage filtering, relay workspace, owner re-issue/disconnect, delete in use, admin API, public enroll/publish/revoke, BYO keys, legacy owner backfill); also run against a real hub (`REGION_HUB_TEST=1`, `REGION_HUB_NAME`/`REGION_HUB_PORT` now configurable).
- RW-B16. **Local stack checked** (own project `rb-rgapi-stack`, ports 27xxx): `stack up`, `seed` and `smoke` pass (call answered, record indexed); `GET /api/regions` lists `default`, the admin API answers 401 without the key, and `fonoster-regions list` with the generated operator key shows the configured region. The first `seed` after a cold `up` can still fail while Routr installs Prisma at boot (as in RC-B17); a second run passes.

- RW-B20. A region's snapshot carries every workspace bound to it. The cell applies apps, assistants, webhooks and retention per workspace, and the catalog once. A workspace that has rows in the cell but is missing from a full snapshot is removed (apps, webhooks, retention).
- RW-B21. Routr resources of all workspaces are applied together (control-plane refs are unique). With a `sipDomain`, `<label>.<rootDomain>` becomes `<label>.<sipDomain>`; a domain outside the root keeps its first label; without a `sipDomain` domains are unchanged.
- RW-B22. Index entries and usage go out per workspace, only for workspaces of the last applied snapshot; others are dropped with a warning. Old flat usage state moves under the enrolled workspace.
- RW-B23. A relay needs `workspaceRef`; the cell also checks the record's `vcon.fonoster.workspaceRef` and answers `not_found` on a mismatch (no hint about other tenants' calls).
- RW-B24. BYO keys (PR-20): the gateway asks `cell.workspacekeys.get` through `CellSecrets.NatsWorkspaceKeys` (2 s, no cache); the agent forwards `region.R.secrets.get` over the link only for public regions and the region's workspaces, and answers `{}` on none, error or timeout. Values are never logged or stored.
- RW-B25. Gateway option `cellSecrets.workspaceKeysFromCloud: true` (public regions): workspace key from the cloud, then the region's keys, then the database.
- RW-B26. Tokens no longer need `wsp`; `rid` and `knd` are read. The enrolled identity stores `regionId`, `kind`, `sipDomain` (`workspaceRef` optional). New error hint `region_deleted`.
- RW-B27. `fonoster-regions` replaces `fonoster-region`, which stays as an alias to the same file and prints a one-line deprecation warning.
- RW-B28. Cloud commands `create|list|token|publish|revoke` call `/api/admin/regions` with `x-operator-key` (from `--operator-key` or `FONOSTER_OPERATOR_KEY`, never printed); API from `--api` or `FONOSTER_API_URL` (default `https://api.fonoster.com`; local stack `http://localhost:$RB_API_PORT`).
- RW-B29. Data dirs and Kubernetes Secret names keep `fonoster-region` (`/var/lib/fonoster-region`) so existing installs keep working. Open: no Helm value for `workspaceKeysFromCloud` yet (task 5.9).
## RD-B (rgdash: dashboard regions at the user level)

- RD-B1. Regions live on the start screen, not in a workspace: `/workspaces` has a "Your regions"
  section (private regions + outline "New region"); `/regions/new`, `/regions/:ref` (detail) and
  `/regions/:ref/setup` use the start layout (no sidebar). The in-workspace `region-setup` route is
  gone. A user with no workspaces but with a private region is not redirected to Create workspace.
- RD-B2. Create workspace = name + one Region select (Default + the user's regions, waiting/offline/
  unsupported disabled, "can't change later"); no confirm step. `createWorkspace({name, region})`
  sends the region id; `default` is the default.
- RD-B3. Shapes assumed from the SDK brief, behind a local adapter (`regions/sdk-api.ts`, cast, so
  it builds before the SDK lands): `listRegions()` may return an array or `{items}`; items carry
  `ref, id, displayName, kind, state` (`status` accepted); `getRegion(ref)` adds `version,
  lastSeenAt, components{mediaNodes,gateways}, activeCalls, sipDomain, endpoints, workspaces[],
  secretsNeeded[], secretsSet[]`; `createRegion` returns `{ref,id,token,expiresAt}`;
  `reissueRegionToken(ref)` returns `{token,expiresAt}`. A failed list falls back to `default` only.
- RD-B4. Monthly fee row shows only when `getRegion` returns `monthlyFeeCents` (assumed field,
  cloud only); self-hosted shows no row.
- RD-B5. A workspace's region is resolved by id from the region list, then its detail by ref.
  Settings > Region is read-only with a "Manage region" link for private regions; Secrets for a
  private region shows Set/Missing and links to the region. `RegionBanner` unchanged in behaviour.
- RD-B6. No UI yet for rename (`updateRegion`) or delete (`deleteRegion`); both are in the API
  adapter. Key command is `fonoster-regions secrets set <name>` (PR-21).

## RM-B (rgmin: regions simplified to the start screen)

- RM-B1. Owner direction: regions were too many screens. `/workspaces` now shows each private region as a compact row (display name, status dot and short label, a More button). The pages `/regions/new`, `/regions/:ref` and `/regions/:ref/setup` are removed.
- RM-B2. A waiting region shows its install command inline (Compose | Helm, Copy, small expiry line). It hides once the region connects. The token lives in memory only (from `createRegion` or Re-issue); without one (after a reload) the row shows a "Re-issue token" link, also shown when the token has expired. The list polls every 5 s while any region is waiting.
- RM-B3. More opens a right-side drawer, deep-linkable as `/workspaces?region=<ref>`: status, version, last seen, SIP domain, connection details (copy), workspaces using it, keys Set/Missing with the `fonoster-regions secrets set <name>` hint, Re-issue token (closes the drawer; the command appears in the row) and Disconnect (inline confirm in the drawer footer). Nodes, active calls and monthly fee are no longer shown.
- RM-B4. New region is a small dialog (ID, display name, SIP domain, same validation); after create the region appears as waiting with its command block.
- RM-B5. Settings > Region ("Manage region"), Secrets and the region links now point at the drawer. Create workspace's region select is unchanged.
- RM-B6. `regions/sdk-api.ts` uses the typed `sdk.regions.*` calls and `@fonoster/types` (`listRegions` returns `{items}`); a public region without a `ref` gets `rg_<id>`.
- RM-B7. Per the final designs, Settings > Region is one line (name, status dot, "View region →" opening the drawer); no details table.

## AD-B (adapters stream)

- AD-B1. App warnings for missing keys (task 4.3 rest): an app needs a key for each provider its
  saved settings name (voice, STT model, Autopilot language model; "platform default" names
  none). Private region: missing = needed − the keys set in the region (region `secrets`). Public:
  missing when the workspace has no key and the catalog does not list the provider (ListCatalog
  lists only providers with a platform or workspace key, registry 4.1; without
  `registry.platformCredentials` nothing is missing). The apps list shows one line ("Missing
  keys: Support line (elevenlabs).") and an app page "This app needs a key for openai.", each with
  an "Add key" link: the region drawer (private) or Vendor keys (public). Unknown state (catalog
  or region not loaded) shows nothing.
