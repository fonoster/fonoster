# Proposal

## Why

A stream app (Apps → app) could only be tested by routing a phone number to it. Agents have
**Talk to agent**, and the browser call already reaches any app: it names its target with
`X-App-Ref`, and on app.fonoster.ai (v0.32.0) opening a stream app on the agent page connected,
started the app's session and recorded the call (fonoster/fonoster#1145). Only the button was
missing.

## What Changes

- The app detail page offers **Talk to app**, which opens the same Talk drawer as agents, for the
  saved app, listing the numbers routed to the app.
- The drawer's copy names neither agents nor apps ("No phone number is linked yet").
- "A browser call reaches the agent" names agents and stream apps, with a scenario for a stream app.

## Impact

- Capability: `talk-in-browser` (one requirement added, one modified).
- Code: `mods/dashboard/src/session/app-detail.tsx`, `mods/dashboard/src/agents/talk/talk-drawer.tsx`.
- Dev stack: AppBridge and the apiserver allow `host.docker.internal`, so a test can run a stream
  app on the machine (`ops/rebuild/compose.yaml`).
- Test: `mods/dashboard/e2e/talk-app.real.spec.ts` (DSH-065, the `real` project).
- Design: `designs/dashboard.pen` "Apps / Detail / Talk to app" and the "Talk drawer" component.
