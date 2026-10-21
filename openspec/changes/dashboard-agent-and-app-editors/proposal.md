# Proposal

## Why

The dashboard spec names Agents and Apps in the sidebar and specifies the agent pickers, but not
how an agent or an app is created, edited, renamed or deleted. The owner asked (2026-10-20) for every
create and manage path of agents and voice apps to be specified and tested.

## What Changes

- One requirement for agents: created from a template, edited as one form across tabs, a tab with an
  invalid field is marked and nothing is saved, renamed inline, deleted after typing `DELETE`.
- One requirement for apps: created with a `ws://` or `wss://` URL, the signing secret shown once,
  Twilio apps without speech settings, the recording policy saved, the secret rotated in one click,
  deleted after typing `DELETE`.
- No behavior change is intended.

## Impact

- Capability: `dashboard` (requirements added).
- Catalog: DSH-028 and DSH-029; DSH-028 also covers "A new agent prefers keyless providers", and
  DSH-029 covers "Creating an app".
- Tests: `mods/dashboard/e2e/apps.community.spec.ts` against an in-memory applications fake
  (`e2e/apps.ts`).
- Code: none.
