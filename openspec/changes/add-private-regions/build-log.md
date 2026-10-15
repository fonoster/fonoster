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
