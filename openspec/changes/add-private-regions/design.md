## Context

`add-platform` already decides the architecture: one global control plane, many cells (PL7);
private regions are customer-operated cells linked outbound-only over a NATS leaf node with TLS
(PL6); call content and provider keys stay in the cell; the control plane keeps the call-record
index. Identity has no account or organization level: a workspace has one owner user.

## Goals / Non-Goals

**Goals:** the simplest model a customer can understand ("my workspace runs in my region"); a
single copy-paste to connect a cell; no inbound ports on the customer network; keys never leave
the customer's cell; a dashboard that works the same for public and private workspaces wherever it
can.

**Non-goals:** moving a workspace between regions; one private region serving several workspaces;
an organization/account level; Fonoster operating or upgrading customer cells (PL6).

## Decisions

**PR-1. A workspace lives in one region, chosen at creation, forever.** (Owner, 2026-10-15)
- Public or private, the region is fixed when the workspace is created. Every number, app, call
  and record of the workspace belongs to that region; outbound calls run there too.
- Rejected: per-number or per-app placement, and region moves (data migration, split records).

**PR-2. A private region belongs to exactly one workspace.** (Owner)
- Created together with its workspace from "New workspace". Deleting the workspace revokes the
  region. A customer with several workspaces runs several cells (they may share hardware).
- Rejected: account-owned regions shared across workspaces; an organization level (large Identity
  change).

**PR-3. One-time enrollment JWT, exchanged for long-lived cell credentials.** (Owner)
- Token: ES256 JWT signed by the control plane; claims `iss` (control plane), `sub` (region id),
  `wsp` (workspace ref), `cp` (control-plane API URL), `leaf` (leaf-node URL), `jti`, `exp`
  (24 h). Single use: the `jti` is spent on enrollment.
- Enrollment: the cell generates a key pair, calls the enrollment endpoint with the token and its
  public key, and receives NATS leaf credentials scoped to `region.<id>.>` plus the region's
  config. Credentials are stored on the cell (file or Kubernetes Secret).
- Re-issuing a token from the dashboard and enrolling with it revokes the old credentials (one
  live cell identity per region). "Disconnect" revokes without re-issuing.
- Rejected: a long-lived token as the credential (a copied token impersonates the region).

**PR-4. Provider keys of a private region live only in the cell.** (Owner; keeps PL6's promise)
- The dashboard shows the secret names the region's config needs (from apps and the catalog) and,
  per name, whether the cell reports it as set. Values are set on the cell
  (`fonoster-region secrets set <name>`, Helm values or an existing Kubernetes Secret) and never
  cross the link. Public-region workspaces keep today's workspace Secrets.
- Rejected: workspace-managed keys sealed to the cell (simpler management, but keys in our cloud).

**PR-5. The dashboard reads private content through a relay.** (Owner)
- Opening a call asks the control plane, which asks the cell over the outbound link and streams
  the bytes to the browser (recordings, transcripts, vCon). Nothing is written centrally; access is
  checked by the control plane per user and audited in the cell.
- Rejected: a customer-published HTTPS endpoint (needs inbound ports and TLS) and metadata-only.

**PR-6. Status from heartbeats; versions in a supported window.** (Proposed default)
- The cell sends a heartbeat every 30 s: version, nodes (media nodes, gateways), active calls,
  capacity, secrets set. States: `waiting` (never enrolled), `connected`, `degraded` (a component
  unhealthy), `offline` (no heartbeat for 2 min), `unsupported` (version outside the window).
- Window: the current and previous minor release. Outside it, config sync pauses with a reason
  shown in the dashboard; calls keep running on the last synced config.

**PR-7. What syncs to a private cell.** (Proposed default)
- Numbers, apps (including Autopilot assistants), Routr resources (domains, agents, trunks, ACLs),
  the provider catalog, webhook endpoint config and recording policy. Central config is
  authoritative; the cell owns only its secrets. Webhooks are delivered from the cell.

**PR-8. Existing workspaces are pinned to the default public region.** (Proposed default)

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Customer loses the cell's credentials | Re-issue a token from the dashboard and re-enroll; old credentials revoked |
| A private region offline hides content | Dashboard shows "Your region is offline" with last heartbeat; metadata still shown |
| Secrets missing on the cell break calls | Region page lists every needed name with set/missing; apps warn before calls fail |
| Relay load on the control plane | Streamed, not buffered; size and rate limits per workspace |
| Immutable region frustrates a customer who chose wrong | Clear choice at creation with a confirm step; a new workspace is the way out |

## Open Questions

1. Public region names and the default (e.g. `us-east-1`, `eu-west-1`).
2. Whether a workspace on a private region can still use Fonoster-hosted Autopilot (the agent runs
   in the cell vs calls out to us), and how its LLM keys follow PR-4.
3. Billing for private regions (per minute from the index, flat fee, or both).
