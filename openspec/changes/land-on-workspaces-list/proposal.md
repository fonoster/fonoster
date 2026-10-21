# Proposal

## Why

After sign-in the dashboard opens the workspace used last, when it still exists, and shows the
workspaces list only when nothing is remembered. The owner wants every user, in every edition
(cloud, community, the dev container), to land on the workspaces list after sign-in (decision
2026-10-20, while bringing the Dashboard area into the QA catalog). One landing is simpler to
explain, to test and to design for, and the list is where a user with several workspaces needs to
be anyway.

## What Changes

- After sign-in, and on `/` with a session, the dashboard SHALL show the workspaces list. The
  remembered-workspace shortcut is removed, with its storage key.
- A user with no workspace still goes to Create workspace. A deep link to `/w/<ref>` with a session
  still opens that workspace.
- An invitee who has just set a password lands on the same list (scenario wording only; the code already did this).
- The existing end-to-end tests are updated and tagged with their catalog cases (DSH-001, DSH-002).

## Impact

- Capability: `dashboard` (requirement "Users land on a workspace after sign-in" replaced).
- Code: `mods/dashboard/src/workspaces/workspace-session.ts` and its callers, `mods/dashboard/e2e/community.spec.ts`.
- Docs: `docs-site/self-hosting/install-compose.mdx` (one sentence).
- Design: no new frame; the Choose a workspace screen already exists in `designs/dashboard.pen`.
