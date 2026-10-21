## 1. Behavior

- [x] 1.1 `landingTarget` returns the list for any user with workspaces; remove `rememberedWorkspace`, `rememberWorkspace` and the `fonoster.workspace` storage key and their call sites; verify unit tests
- [x] 1.2 Update the sign-out test that cleared the key

## 2. Tests and catalog

- [x] 2.1 Update `e2e/community.spec.ts`: reload at `/` shows the list; tag the test `[DSH-001]`; verify the mocked Playwright project
- [x] 2.1a Tag the invitee test `[DSH-002]`; prove it red by disabling the set-password guard
- [x] 2.1b Tag the sign-out test `[DSH-003]`, add the cleared-cache assertion, prove both faults red
- [x] 2.1c DSH-010 and DSH-011 added and proven; fix: `PublicOnly` honors a same-origin `next` instead of racing the form to `/`
- [x] 2.2 Update DSH-001 and DSH-012 in `mods/conformance/catalog/areas/dashboard.md` to the new scenarios; `build.cjs` green for the tagged test

## 3. Docs

- [x] 3.1 `install-compose.mdx`: the workspaces list always appears after sign-in
- [x] 3.2 `openspec validate land-on-workspaces-list --strict` passes
