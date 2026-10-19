# Docs checkpoint — reference/sdk

Started: 2026-10-19
Current stage: 7 — Wire (listed in report; lead wires docs.json)

**Purpose:** The look-up page for `@fonoster/sdk`: install, create a client, sign in (workspace chosen by the WO access key ID), then every client class with methods, key params and return shapes.

**Diátaxis type:** reference
**Reader:** developers managing a workspace from code

**Placement:** new `docs-site/reference/sdk.mdx` · nav group `Reference`

**Sources:**
- mods/sdk/src/*.ts (every class), client/{Client,WebClient,AbstractClient,TokenRefresherNode}.ts, utils.ts
- mods/types/src/*.types.ts (request/response shapes)
- mods/common/src/protos/identity.proto (invite request), mods/identity/src/utils/generateAccessKeyId.ts (WO/AP prefixes)
- mods/apiserver/src/applications/createCreateApplication.ts (Autopilot gets no signing secret)

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | client, conventions, one section per class |
| 4 | Assets | skipped | reference page, no picture needed |
| 5 | Draft | done | |
| 6 | Proof | done | 200 on :3334 |
| 7 | Wire | done | reported |

## Unverified
- Not run against a live API. Browser `WebClient` usage not tried.
- `statusStream` yields `ERROR` for no answer (code path read; see OPEN-QUESTIONS).

## Decision log
- 2026-10-19 — Tables per class (method, purpose, key params, returns); ParamField only for Client options and createApplication.
- 2026-10-19 — Left out `Users` (account flows) and Regions' create/enroll methods (Private regions tab); kept listRegions/getRegion for createWorkspace.
- 2026-10-19 — Left out internal-looking client getters (get*Client) and `evaluateIntelligence` details beyond event names.
