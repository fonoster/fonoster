# Tasks

## 1. Spec

- [ ] 1.1 Requirements for the shared shape, the six SIP network resources and the five workspace resources
- [ ] 1.2 `openspec validate dashboard-resource-screens --strict` passes

## 2. Catalog

- [ ] 2.1 Cases in `mods/conformance/catalog/areas/dashboard.md`, one per resource plus the shared shape, each with a proof
- [ ] 2.2 The area's `tests:` glob reaches every spec file under `mods/dashboard/e2e`
- [ ] 2.3 `build.cjs --update-lock`: new ids locked, `uncovered-scenarios.txt` shrinks

## 3. Tests

- [ ] 3.1 Mocked tests in `mods/dashboard/e2e/resources.community.spec.ts`, every pull request
- [ ] 3.2 One nightly case through the UI against the stack: credentials, domain, SIP agent, ACL, trunk, number, then delete in reverse
- [ ] 3.3 Every case seen red on its proof

## 4. Findings

- [ ] 4.1 Small fixes land here; anything larger is filed with its red test
