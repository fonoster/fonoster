## Why

The platform spec (`add-platform`, PL6/PL7) says private regions exist and are customer-operated,
but leaves out how a customer gets one, who owns it, how it enrolls, where its keys live, how its
calls are placed and how the dashboard shows it. This change fills those gaps with the owner's
decisions of 2026-10-15, keeping the model small: one workspace, one region, forever.

## What Changes

- **Every workspace lives in exactly one region**, chosen when the workspace is created and never
  changed. The region is one of Fonoster's public regions or the workspace's own private region.
- **Creating a workspace asks for its region.** Picking "Private region" creates the workspace and
  its region together and shows a one-time enrollment token plus the install command. The
  workspace waits ("Waiting for your region") until the cell connects.
- **Enrollment token**: a short-lived (24 h), single-use JWT signed by the control plane, carrying
  everything needed to start: region id, workspace, control-plane and leaf-node URLs, expiry. The
  cell exchanges it once for its own long-lived credentials, kept on the cell. Re-issuing a token
  re-enrolls and revokes the previous credentials.
- **Provider keys of a private region live only in the cell.** The dashboard lists the names the
  region needs and whether the cell has them; values are set on the cell and never reach us.
- **Call content is relayed, not stored**: the dashboard reads a private region's recordings and
  transcripts through the control plane over the cell's outbound link, streamed to the browser,
  never stored centrally. This replaces the earlier "browser reads from the cell directly".
- **Region status** (waiting, connected, degraded, offline, unsupported version) with version,
  nodes and active calls, shown in the dashboard; disconnecting revokes the cell.
- Dashboard designs for all of the above.

## Capabilities

### New Capabilities
- `private-regions`: workspace region binding, private region creation and enrollment, cell
  credentials and revocation, cell-only secrets, content relay, status and lifecycle, dashboard UX.

### Modified Capabilities
- `regions` (from `add-platform`): "Call content and provider keys never leave the cell" now reads
  content through the relay instead of a browser-to-cell link; "Private regions are customer-
  operated" points here for enrollment.

## Impact

- Identity / apiserver: `Workspace.region` (immutable), region records, enrollment and credential
  issuing, revocation; NATS leaf-node accounts per private region.
- Cell side: an enrollment step in the media node / gateway / Compose and Helm (`fonoster-region
  enroll <token>`), local secret store, heartbeat, relay responder.
- Dashboard: new-workspace region picker, private region setup page, Region page, Secrets page for
  private workspaces, call content via relay, offline banners.
- Existing workspaces are assigned to the default public region.
