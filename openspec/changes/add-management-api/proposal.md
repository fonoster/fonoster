## Why

The management API (applications, secrets, numbers, trunks, agents, credentials, domains, ACLs and
API keys) has no spec. `control-plane` covers the architecture under it and only says the API is
"unchanged". The API QA area needs requirements its cases can cite, and two behaviors found while
writing them are wrong: a lookup of another workspace's resource answers `PERMISSION_DENIED`, which
tells the caller the ref exists, and the SIP resources' list can skip items between pages.

## What Changes

- New capability `management-api`: the rules every resource shares (validation, unknown refs,
  workspace isolation, pagination, deletion).
- **BREAKING (error code only):** get, update and delete of another workspace's resource answer
  `NOT_FOUND`, the same as an unknown ref, instead of `PERMISSION_DENIED`.
- A resource is reachable only from the workspace the call acts as, not from any workspace in the
  caller's token: a user in A and B acting as B no longer reaches A's resources.
- The SIP resources' paginated list no longer drops items it fetched past the page size.

## Capabilities

### New Capabilities

- `management-api`: the shared behavior of the workspace resources served by the apiserver.

### Modified Capabilities

- `control-plane`: a number or ACL of another workspace answers `NOT_FOUND`, not `PERMISSION_DENIED`.

## Impact

- `mods/identity/src/utils/withAccess.ts` and `hasAccessToResource.ts` (used by the apiserver and
  sipnet), and `mods/sipnet/src/resources/paginationUtils.ts`.
- Clients that branch on `PERMISSION_DENIED` for a foreign ref: none in the dashboard or the SDK.
- Cases live in the API area (`mods/conformance/catalog/areas/api.md`).
