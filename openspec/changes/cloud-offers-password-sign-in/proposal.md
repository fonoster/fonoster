# Proposal

## Why

The dashboard spec describes Cloud sign-in as GitHub plus an emailed code, with no password field,
while the Cloud Helm values enable only `password`. Neither is what the owner wants (decision
2026-10-20, while bringing the Dashboard area into the QA catalog): every edition offers email and
password; Cloud also offers an emailed code, and GitHub when a GitHub app is configured. The sign-in
page already renders all three together; only the spec, the Cloud configuration and the tests say
otherwise.

## What Changes

- `dashboard`: the Cloud scenario becomes password, emailed code and optional GitHub, with the
  password form first and a link to use a code instead. A scenario for Cloud without GitHub is
  added.
- `dashboard`: the Wrong credentials scenario asks for what matters, that no screen reveals whether an email has an account, instead of one shared message on two different screens.
- `capabilities`: the Cloud configuration example lists `[password, email_code, github]`.
- Cloud Helm values enable `password` and `email_code`; `github` is added where the GitHub app is
  configured.
- End-to-end tests: the cloud fixture advertises all three; the cloud tests are tagged (DSH-006,
  DSH-007, DSH-008) and a cloud password sign-in test is added (DSH-016). All land on the workspaces
  list.

## Impact

- Capabilities: `dashboard`, `capabilities` (scenario text; no RPC change).
- Code: none in the SPA. `ops/rebuild/helm/fonoster-rebuild/values-cloud.yaml`.
- Tests: `mods/dashboard/e2e/fixtures.ts`, `mods/dashboard/e2e/cloud.spec.ts`.
