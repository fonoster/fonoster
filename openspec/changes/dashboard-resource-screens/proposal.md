# Proposal

## Why

The dashboard spec covers sign-in, the session, the agent pickers and Usage, but none of the screens
where a workspace is built: the SIP network (Numbers, Trunks, Domains, SIP agents, ACLs,
Credentials) and the workspace resources (Secrets, API keys, Webhooks, Members, Settings). With no
requirement there is nothing to test against, so the QA catalog's Dashboard area cannot register
cases for them (owner, 2026-10-20: close the gap with emphasis on every CRUD operation).

The rules below are taken from what the screens and the API do today, checked against the v0.27
SIP network API (the protos are unchanged since then), the server validators
(`mods/common/src/validators/sipnet`), the workspace and name checks in `mods/sipnet/src/resources`,
and how the platform uses Routr (numbers route to apps through the media-node peer with
`X-App-Ref`, ACLs allow a list and deny the rest, domains carry egress rules).

## What Changes

- One requirement for what every resource screen shares: list, empty state, one Create action,
  create and edit in a drawer or page, errors shown in the form, a toast on success, and deleting or
  removing asks to type `DELETE` while Rotate and Regenerate stay one click.
- One requirement per SIP network resource with its fields, its validation and what can't change
  after creation.
- One requirement per workspace resource: Secrets, API keys, Webhooks, Members, Settings.
- No behavior change is intended. Where a case finds the screen disagrees with this text, the fix
  is small and lands with the case, or it is filed.

Writing the cases found one bug: the SDK's `Agents.listAgents`, `Agents.getAgent` and
`Numbers.getNumber` called `toObject()` on nested objects that the SDK's decoder already returns as
plain objects, so any SIP agent with a domain broke the SIP agents screen and the number route
picker ("toObject is not a function"). Fixed in this change, with SDK unit tests.

## Impact

- Capability: `dashboard` (requirements added).
- Catalog: new DSH cases in `mods/conformance/catalog/areas/dashboard.md` cite these scenarios.
- Tests: `mods/dashboard/e2e` (mocked, every pull request) against in-memory fakes of the SIP
  network and the workspace (`e2e/sipnet.ts`, `e2e/workspace.ts`); the shared capabilities fixture
  now sends the API's default SIP names rule. One nightly case against the stack follows.
- Code: `mods/sdk/src/Agents.ts`, `mods/sdk/src/Numbers.ts`.
