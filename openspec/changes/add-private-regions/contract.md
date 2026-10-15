# Private region contract (control plane ↔ cell)

The wire contract both sides build against. Additive-only, like media-control: receivers ignore
unknown fields and message types. Version: `fonoster.region.v1`.

## 1. Enrollment token (JWT, ES256)

Issued by the control plane when a private workspace is created or a token is re-issued.

| Claim | Meaning |
| --- | --- |
| `iss` | Control plane URL (e.g. `https://api.fonoster.com`) |
| `aud` | `fonoster.region.v1` |
| `sub` | Region id, `rg_<base32>` |
| `wsp` | Workspace ref (access key id, `WO…`) |
| `cp` | Control-plane HTTPS base URL for enrollment |
| `leaf` | NATS leaf-node URL (`tls://leaf.fonoster.com:7422`; plain `nats://` allowed only when the control plane runs with `regions.allowInsecureLeaf`) |
| `jti` | Unique token id (single use) |
| `iat`, `exp` | Issue time; expiry = issue + 24 h |

Signed with the control plane's region-signing key (`kid` in the header); the public keys are
served at `GET {cp}/.well-known/region-keys.json` (JWK Set).

## 2. Enrollment (HTTPS, cell → control plane)

`POST {cp}/api/regions/enroll`, JSON:

```json
{ "token": "<jwt>", "publicKey": "<cell Ed25519 public key, base64url>", "version": "0.28.1",
  "components": { "mediaNodes": 1, "gateways": 1, "autopilot": true } }
```

Responses:
- `200` `{ "regionRef": "rg_…", "workspaceRef": "WO…", "leafUrl": "…", "credentials": "<NATS creds file text>", "subjects": "region.rg_….>", "configVersion": 0 }`
  The credentials authenticate a NATS user that may publish and subscribe ONLY under
  `region.<regionRef>.>`. They are returned once; the cell stores them (file `0600` or Kubernetes
  Secret). Enrolling revokes any previous credentials of the region.
- `400 token_invalid` (bad signature, wrong `aud`), `410 token_expired`, `409 token_used`,
  `404 region_not_found`, `409 workspace_deleted`.

## 3. Subjects (over the leaf node; `R` = region ref)

| Subject | Direction | Payload |
| --- | --- | --- |
| `region.R.heartbeat` | cell → cp | `{type:"region.heartbeat", regionRef, version, components:{mediaNodes, gateways, autopilot}, activeCalls, secretsSet:["deepgram",…], configVersion, at}` every 30 s |
| `region.R.config` | cp → cell | `{type:"region.config", configVersion, full:true, kinds:{numbers:[…], apps:[…], assistants:[…], routr:{domains,agents,trunks,acls}, catalog:[…], webhooks:[…], recordingPolicy}}` — full snapshot, published on change and on request |
| `region.R.config.request` | cell → cp (request/reply) | `{type:"region.config.request", haveVersion}` → reply is a `region.config` snapshot (or `{type:"region.config.current"}` when `haveVersion` is current) |
| `region.R.secrets.needed` | cp → cell | `{type:"region.secrets.needed", names:["deepgram","groq",…]}` (derived from the workspace's apps and catalog choices) |
| `region.R.relay` | cp → cell (request/reply) | `{type:"region.relay", id, userRef, op:"record.get"|"record.part", callRef, part?, range?}` → reply `{type:"region.relay.chunk", id, seq, last, contentType, data(base64)}`; large content is sent as a sequence of replies on a reply inbox (chunk ≤ 512 KB) |
| `region.R.index` | cell → cp | call-record index entries (same shape as `callrecord.sealed`); the cp forces `accessKeyId` = the region's workspace |
| `region.R.usage` | cell → cp | `{type:"region.usage", minutes, period}` (visibility only; flat fee billing) |
| `region.R.revoked` | cp → cell | `{type:"region.revoked", reason}` best-effort notice before credentials stop working |

## 4. Status rules (control plane)

- `waiting`: never enrolled, or disconnected. `connected`: heartbeat within 2 min, version in window,
  all components > 0. `degraded`: heartbeat within 2 min but a component count is 0.
  `offline`: no heartbeat for 2 min. `unsupported`: version older than the previous minor release
  (config sync paused; reason shown).

## 5. Rules

- The control plane never sends or stores secret VALUES for a private region; only names.
- Index entries from a region are always attributed to that region's workspace.
- Content relayed through the control plane is streamed and never written to storage.
- Workspace ↔ region binding is immutable (`region_immutable`).
