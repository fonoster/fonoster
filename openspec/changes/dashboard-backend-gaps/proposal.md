## Why

The Tailwind dashboard shipped (`dashboard-tailwind-migration`, archived 2026-10-17), but its
section 5 screens need backend or SDK work that was never built: they were listed as follow-ups
while building section 4. They moved here so the dashboard change could be archived.

## What Changes

- Add the backend pieces the dashboard screens need: `appRef` on call records with filters,
  workspace member counts and last activity, the user's pending invites, member role update,
  endpoint health and call stats, transcripts and latency, agent evals and knowledge upload, a
  cost model, and two-step sign-in.
- Fix the small backend gaps found in section 4 (clearing proto3 refs, IPv6 in ACLs, the
  credentials update type, the `Privacy` enum, API key roles, counts and reverse lookups, import
  and test actions).
- Run `test-storybook` in CI for both dashboard projects.

## Capabilities

### Modified Capabilities

- `dashboard`: calls filter by app; member roles can be changed. Other items add their
  requirements when they are designed.

## Impact

- `mods/apiserver`, `mods/identity`, `mods/common` protos, `mods/sdk`, `mods/dashboard`, CI.
