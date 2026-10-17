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

**Decisions of 2026-10-15 (evening), locked one by one with the owner. They supersede PR-2, the
"set up from New workspace" flow and the `fonoster-region` CLI naming.**

**PR-12. "Region" stays the concept.** A region is infrastructure (where calls run), separate from a
workspace (who you are and what is configured). Public and private are the same concept. Marketing:
"Private Regions" (BYOC for enterprise buyers); "cell" is internal only.

**PR-13. One mechanism for public and private regions.** Same install, same enrollment token and
agent, same status, connection details and config sync. They differ only in owner and tenancy:
public = platform-owned, serves every workspace that picks it; private = owned by a user.
Fonoster provides a default public region to reduce friction.

**PR-14. A private region belongs to a user and may serve several of that user's workspaces.**
(Reverses PR-2.) Any workspace with the same owner can pick it at creation; a workspace still never
moves (PR-1). The region receives config, secrets and calls only for its owner's workspaces; data
in the region is keyed by workspace; the cloud checks that every record's workspace belongs to the
region.

**PR-15. Regions are created and onboarded at the user level, not in "New workspace".** A user
creates a private region from their account area (ID, display name, SIP domain), installs and
connects it, and manages it there. Creating a workspace shows one select of the public region(s)
and the user's private regions. Workspace Settings → Region is read-only.

**PR-16. A private region's SIP domain is the customer's own and is required at creation.** Routr
gives workspaces subdomains of it (wildcard), so the customer points wildcard DNS
(`*.sip.acme.com`) at the region and provides the TLS certificate. Public regions use Fonoster's
hostnames. The CLI and every API always go to the cloud API (`api.fonoster.com`; self-hosters their
own URL); regions expose no user API.

**PR-17. The default public region's id is always `default`.** Geography, if any, is only in its
display name.

**PR-18. Region ids and names.** Id: lowercase letters, digits and hyphens, 3–32 characters,
starting with a letter; never changes. Display name: free text, editable. Public ids follow
`<geo>-<area>-<n>` plus `default`. Private: recommended `<company>-<place>`; `default` and public
geo prefixes (`us-`, `eu-`, `sa-`, `ap-`, `af-`, `me-`) are reserved. Private ids are unique per
owner; internally everything keys on the hidden `rg_…` ref.

**PR-19. Public regions are created by an operator with an operator key.** The apiserver config
holds an operator key; region administration (create, list, publish, revoke public regions) uses
it. On the new location the operator enrolls with the same command customers use.

**PR-20. Keys in public regions.** Fonoster's own provider keys are set on each public region with
the same secrets command as private regions (never stored in the cloud database). A workspace's
bring-your-own keys stay in the cloud as encrypted workspace Secrets and are fetched per call.

**PR-21. Region operations live in one ops utility, `fonoster-regions`, not in the `fonoster` CLI.**
Region work is not day-to-day: `fonoster-regions create|list|publish|revoke` (cloud side, operator
key) and `fonoster-regions enroll|secrets|status|run` (on the region machine) ship as a standalone
utility like `fonoster-registry`. Users create private regions from the dashboard.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Customer loses the cell's credentials | Re-issue a token from the dashboard and re-enroll; old credentials revoked |
| A private region offline hides content | Dashboard shows "Your region is offline" with last heartbeat; metadata still shown |
| Secrets missing on the cell break calls | Region page lists every needed name with set/missing; apps warn before calls fail |
| Relay load on the control plane | Streamed, not buffered; size and rate limits per workspace |
| Immutable region frustrates a customer who chose wrong | Clear choice at creation with a confirm step; a new workspace is the way out |

**PR-9. Autopilot runs in the cell.** (Owner, 2026-10-15)
- A private cell runs its own hosted Autopilot (part of the Compose/Helm install). Assistants sync
  like apps (PR-7); LLM keys stay in the cell like other provider keys (PR-4). Conversations never
  leave the customer network.
- Rejected: the cell calling out to Fonoster's hosted Autopilot (conversation data and LLM keys
  would leave the region), and a per-app choice.

**PR-10. One public region at launch.** (Owner)
- `us-east-1` is the only public region and the default; the picker lists regions from data, so
  adding `eu-west-1` later needs no UI change. "Private region" is always offered.

**PR-11. Private regions are billed as a flat fee per region.** (Owner)
- A fixed monthly price per private region; the customer pays its own carriers and vendors. Usage
  (minutes from the call-record index) is still reported for visibility, not billed.
- Rejected: per-minute billing of customer-run infrastructure, fee plus minute allowance.

## Open Questions

None. PR-6, PR-7 and PR-8 are proposed defaults the owner may revisit.
