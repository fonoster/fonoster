# Region contract (control plane ↔ region)

The wire contract both sides build against. Additive-only, like media-control: receivers ignore
unknown fields and message types. Version: `fonoster.region.v1`.

Since PR-12..PR-21 (2026-10-15 evening) one mechanism serves public and private regions. A region
has a hidden ref (`rg_<base32>`, what every subject and record keys on), an `id` (PR-18), a
display name, a `kind` (`public` | `private`) and a SIP domain. A private region belongs to a user
(`ownerRef`) and serves any of that user's workspaces that picked it; a public region is created
by an operator and serves every workspace that picked it (PR-13, PR-14, PR-19).

## 0. Regions, ids and the APIs (HTTP, on the API server's HTTP bridge)

**Ids (PR-18).** `^[a-z][a-z0-9-]{2,31}$` (lowercase letters, digits, hyphens; 3–32 characters;
starts with a letter); never changes. Private ids are unique per owner; `default`, the public geo
prefixes `us-`, `eu-`, `sa-`, `ap-`, `af-`, `me-` and the route words `current`, `enroll`, `admin`
are refused (`region_id_reserved`). Public ids are `default` or `<geo>-<area>-<n>`
(`us-east-1`), unique among public regions.

**SIP domain (PR-16).** Required for a private region: a lowercase FQDN (at least two labels,
each 1–63 of `a-z0-9-`, not starting or ending with `-`, alphabetic TLD, ≤ 253 characters, no
wildcard). The customer points wildcard DNS (`*.<sipDomain>`) at the region. Optional for a
public region (it then uses Fonoster's hostnames).

**Workspace binding.** `Workspace.region` holds the region's `id` for a public region (`default`,
`us-east-1`) and the region's ref (`rg_…`) for a private one (private ids are only unique per
owner). It is fixed at creation (`region_immutable`).

**User API** (Bearer user access token; `sub` is the owner; no workspace needed). `:region` is the
region's id or ref.

| Method and path | Body → answer |
| --- | --- |
| `GET /api/regions` | → `{items: RegionSummary[]}`: the public regions offered (configured ones, plus published and connected ones) and, when authenticated, the caller's private regions with status. No auth needed for the public list. |
| `POST /api/regions` | `{id, displayName, sipDomain}` → `{ref, id, token, enrollmentToken, expiresAt}` (`token` = `enrollmentToken`, shown once). `400 region_id_invalid \| region_id_reserved \| sip_domain_invalid \| display_name_invalid`, `409 region_id_taken`, `503 regions_unavailable` |
| `GET /api/regions/current` | → `Region` of the workspace in `x-accesskey-id` (any member); secrets limited to that workspace |
| `GET /api/regions/:region` | → `Region` (the owner's private region, or an offered public region) |
| `PATCH /api/regions/:region` | `{displayName}` → `Region` (owner; the id never changes) |
| `POST /api/regions/:region/token` | → `{token, enrollmentToken, expiresAt}` (owner). Enrolling with it revokes the current cell. |
| `POST /api/regions/:region/disconnect` | → `{status:"waiting"}` (owner). Revokes the cell now. |
| `DELETE /api/regions/:region` | → `{ref}` (owner). `409 region_in_use` while any workspace uses it (`workspaces` in the message). |
| `POST /api/regions/enroll` | the cell's enrollment (§2) |

`RegionSummary`: `{ref?, id, name, displayName, kind, default, status, sipDomain?, workspaces?}`
(`name` = `displayName`; configured public regions have no `ref`).

`Region` (GET): the summary plus `ownerRef?`, `published?`, `state` (= `status`), `reason?`,
`unsupportedReason?`, `requiredVersion?`, `version?`, `lastHeartbeatAt?`, `enrolledAt?`,
`components`, `mediaNodes`, `gateways`, `activeCalls`, `configVersion`, `reportedConfigVersion`,
`workspaces: [{ref, accessKeyId, name, domain?}]` (owner views only), `secretsNeeded`,
`secretsSet`, `secrets: [{name, usedBy, set}]`, `endpoints?` (with `sipDomain`), `workspaceDomain?`
(`/current` only).

**Admin API** (PR-19): authorized ONLY by the operator key in `x-operator-key` (the apiserver's
`regions.operatorKey`; `secret://` references allowed). Without a configured key every admin
call answers `404`. A wrong key answers `401 operator_key_invalid`.

| Method and path | Body → answer |
| --- | --- |
| `GET /api/admin/regions` | → `{items: Region[]}`: every region (public and private, with owner and workspace count) plus the configured public regions |
| `POST /api/admin/regions` | `{id, displayName, sipDomain?, endpoints?}` → `{ref, id, token, enrollmentToken, expiresAt}`: a public region, unpublished |
| `POST /api/admin/regions/:region/token` | → `{token, enrollmentToken, expiresAt}` |
| `POST /api/admin/regions/:region/publish` | → `Region`: offered in pickers while connected |
| `POST /api/admin/regions/:region/revoke` | → `Region`: withdrawn from pickers and its cell's credentials revoked (workspaces stay bound; re-enroll with a new token) |

**Configured public regions** (`regions.public` in fonoster.yaml) stay as a fallback: the local
stack and self-hosted installs have no enrolled public region, so the configured `default` is
always offered and treated as connected. When an enrolled public region has the same id, the
enrolled one is shown once it is published and connected; otherwise the configured entry is.
Workspaces bind to the id either way.

## 1. Enrollment token (JWT, ES256)

Issued by the control plane when a region is created (user or operator) or a token is re-issued.

| Claim | Meaning |
| --- | --- |
| `iss` | Control plane URL (e.g. `https://api.fonoster.com`) |
| `aud` | `fonoster.region.v1` |
| `sub` | Region ref, `rg_<base32>` |
| `rid` | Region id (`acme-hq`, `us-east-2`) |
| `knd` | `public` \| `private` |
| `cp` | Control-plane HTTPS base URL for enrollment |
| `leaf` | NATS leaf-node URL (`tls://leaf.fonoster.com:7422`; plain `nats://` allowed only when the control plane runs with `regions.allowInsecureLeaf`) |
| `jti` | Unique token id (single use) |
| `iat`, `exp` | Issue time; expiry = issue + 24 h |

`wsp` (a workspace ref) is gone: a region serves several workspaces (PR-14). Signed with the
control plane's region-signing key (`kid` in the header); the public keys are served at
`GET {cp}/.well-known/region-keys.json` (JWK Set).

## 2. Enrollment (HTTPS, region → control plane)

`POST {cp}/api/regions/enroll`, JSON:

```json
{ "token": "<jwt>", "publicKey": "<cell Ed25519 public key, base64url>", "version": "0.28.1",
  "components": { "mediaNodes": 1, "gateways": 1, "autopilot": true } }
```

Responses:
- `200` `{ "regionRef": "rg_…", "regionId": "acme-hq", "kind": "private", "sipDomain": "sip.acme.com", "workspaceRefs": ["WO…"], "leafUrl": "…", "credentials": "<NATS creds file text>", "subjects": "region.rg_….>", "configVersion": 0 }`
  The credentials authenticate a NATS user that may publish and subscribe ONLY under
  `region.<regionRef>.>`. They are returned once; the cell stores them (file `0600` or Kubernetes
  Secret). Enrolling revokes any previous credentials of the region. `workspaceRefs` is
  informational (the config snapshot is authoritative).
- `400 token_invalid` (bad signature, wrong `aud`), `410 token_expired`, `409 token_used`,
  `404 region_not_found`, `409 region_deleted`.

## 3. Subjects (over the leaf node; `R` = region ref)

| Subject | Direction | Payload |
| --- | --- | --- |
| `region.R.heartbeat` | region → cp | `{type:"region.heartbeat", regionRef, version, components:{mediaNodes, gateways, autopilot}, activeCalls, secretsSet:["deepgram",…], configVersion, endpointsHash?, at}` every 30 s |
| `region.R.endpoints` | region → cp | `{type:"region.endpoints", sip:[{host, port, transport:"udp"\|"tcp"\|"tls"\|"ws"\|"wss"}], signalingAddresses:[…], mediaAddresses:[…], rtpPorts:{min, max}, updatedAt}` — on connect and whenever they change; public addresses only |
| `region.R.endpoints.request` | cp → region | `{type:"region.endpoints.request"}` (plain publish) |
| `region.R.config` | cp → region | the snapshot (below), published on change and on request |
| `region.R.config.request` | region → cp (request/reply) | `{type:"region.config.request", haveVersion}` → a `region.config` snapshot, `{type:"region.config.current", configVersion}` or `{type:"region.config.paused", reason, requiredVersion}` |
| `region.R.secrets.needed` | cp → region | `{type:"region.secrets.needed", names:[…], workspaces:{"<accessKeyId>":[…]}}`: provider ids the region's apps need (union, and per workspace) |
| `region.R.secrets.get` | region → cp (request/reply) | §6 (public regions: a workspace's bring-your-own key, per call) |
| `region.R.relay` | cp → region (request/reply) | `{type:"region.relay", id, userRef, workspaceRef, op:"record.get"\|"record.part", callRef, part?, range?, original?, version?}` → `region.relay.chunk` replies (`{id, seq, last, contentType, data(base64)}`, chunk ≤ 512 KB) or one `{type:"region.relay.error", id, code, message?}` |
| `region.R.index` | region → cp | call-record index entries (same shape as `callrecord.sealed`, `workspaceRef` = the record's workspace) |
| `region.R.usage` | region → cp | `{type:"region.usage", workspaceRef, minutes, period}` per workspace (visibility only) |
| `region.R.revoked` | cp → region | `{type:"region.revoked", reason}` best-effort notice before credentials stop working |

**Config snapshot** (full, authoritative, one per region; keyed by workspace):

```
{ type: "region.config", configVersion, full: true,
  region: { ref, id, kind, sipDomain | null, rootDomain },
  catalog: [ …provider, model and voice entries any workspace's apps use… ],
  workspaces: {
    "<accessKeyId>": { ref, name, domain | null,
      kinds: { numbers, apps, assistants, routr: {domains, agents, trunks, acls}, webhooks, recordingPolicy } } } }
```

- `workspaces` holds every workspace bound to the region (a private region: its owner's
  workspaces that picked it; a public region: every workspace that picked it). A workspace missing
  from a snapshot is gone from the region: the region removes its apps, webhooks, retention rows
  and Routr resources.
- Routr domains (PR-16): with a `sipDomain`, a domain `<label>.<rootDomain>` of the cloud becomes
  `<label>.<sipDomain>` in the region (the label is the cloud domain's first label(s), already
  unique); `domain` per workspace is the first such domain (what softphones use). Without a
  `sipDomain` domains are written as they are.
- `apps` are application rows in the gateway's `appFromRow` columns (with the app's session
  `signingSecret`), `assistants` are `{appRef, productRef, config}`, `webhooks` include the
  endpoint signing secrets (Fonoster-generated, not provider keys), `recordingPolicy` is
  `{transcripts, recordings, retention:[{part, days}]}`.

**Reply subjects stay inside the region.** The leaf credentials allow only `region.R.>`, so a
request that crosses the link carries a reply subject under `region.R._INBOX.>`: the control plane
uses `region.R._INBOX.<id>` for relay requests, and the region's link client connects with
`inboxPrefix: "region.R._INBOX"` (nats.js) for `region.R.config.request` and `region.R.secrets.get`.

Other rules carried over (RG-B4, RE-B2): chunk `seq` starts at 0; the control plane reorders and
gives up when the first chunk takes over 5 s (`region_offline`, HTTP 503) or the next over 10 s. A
heartbeat whose `configVersion` is behind makes the control plane resend the current snapshot.
Heartbeats, endpoints, index, usage and secret requests from a region that is not enrolled are
ignored. `endpointsHash` is the first 16 lowercase hex characters of the sha256 of
`{"sip":[[host,port,transport]…],"signalingAddresses":[…],"mediaAddresses":[…],"rtpPorts":[min,max]|null}`
in send order; a different hash (or none while nothing is stored) makes the cp publish
`region.R.endpoints.request`. The control plane cleans what it stores (at most 16 SIP entries and
32 addresses per list).

## 3a. Endpoints of configured public regions

Configured public regions carry the same `endpoints` shape in `regions.public[]`; an enrolled
region reports its own. Every `Region.endpoints` also carries the region's `sipDomain`.

## 4. Status rules (control plane)

- `waiting`: never enrolled, disconnected, or enrolled less than 2 min ago without a heartbeat.
  `connected`: heartbeat within 2 min, version in window, all components > 0. `degraded`:
  heartbeat within 2 min but a component count is 0. `offline`: no heartbeat for 2 min.
  `unsupported`: version older than the previous minor release (config sync paused; reason shown).
- A configured public region is always `connected`.
- Pickers offer a public region row only when it is published and `connected` or `degraded`.

## 5. Rules

- Every record a region sends (index, usage) must name a workspace bound to that region; others
  are dropped. A relay names the caller's workspace, and the region serves only that workspace's
  records.
- The control plane never sends or stores secret VALUES for a private region; only names.
- Public regions: Fonoster's own provider keys are set on the region with the same secrets
  command (never stored in the cloud database); a workspace's bring-your-own keys are fetched per
  call (§6).
- Content relayed through the control plane is streamed and never written to storage.
- Workspace ↔ region binding is immutable (`region_immutable`); a region with workspaces cannot
  be deleted (`region_in_use`).

## 6. Bring-your-own keys in public regions (PR-20)

`region.R.secrets.get`, region → cp, request/reply (reply under `region.R._INBOX.>`):

- Request: `{type:"region.secrets.get", workspaceRef, provider}` (`provider` is a catalog provider
  id, e.g. `deepgram`).
- Replies: `{type:"region.secrets.value", workspaceRef, provider, value}` when the workspace has
  a key for that provider; `{type:"region.secrets.none", workspaceRef, provider}` when it has none
  (the region's own platform key applies); `{type:"region.secrets.error", code}` with
  `not_public` (private regions never get values), `workspace_not_in_region` or `bad_request`.
- The control plane answers only for an enrolled public region and a workspace bound to it. The
  value is used for the one call that asked and never cached beyond it, never written to disk and
  never logged, on either side.
- Inside the region the gateway asks the region agent on the cell's own NATS
  (`cell.workspacekeys.get`, `{workspaceRef, provider}` → `{value?}`); the agent forwards over the
  link. Local subjects never cross the leaf node.
