# Proposal

## Why

Conformance proves the contracts (175 scenario files in `mods/conformance`), and a separate QA
catalog was drafted to register every other kind of test. Two registers mean two places to look, two
id schemes and two release gates, and tests that exist outside either of them. The owner asked
(2026-10-20) for one: every test that is not a unit test is a catalog case, there are no manual
tests, and a release ships with a report that proves it.

## What Changes

- The `conformance` capability becomes "Conformance and QA". The catalog lives in
  `mods/conformance/catalog` next to the scenarios, fakes and runner.
- Every non-unit test is a catalog case with a stable id, in an **area** (one tester, one unit under
  test, one diagram, one cadence).
- Contract cases run conformance scenario files (`runs`); every scenario file belongs to a case.
- The coverage gate works at scenario level: each of the spec scenarios is run by a test or listed
  in `uncovered-scenarios.txt`, a list that only shrinks.
- A release report is generated from JUnit results, with a gate (P0 pass, P1 pass or waived).
- No manual tests.
- One generic trunking-provider suite replaces per-carrier suites; provider differences live in a
  fixture file.

## Impact

- Affected capability: `conformance` (requirements added).
- Affected code: `mods/conformance/catalog` (moved from `docs/qa`), later `mods/conformance/src/harness`
  and `mods/conformance/suites`; CI gains a release-gate job.
- Existing non-unit tests are tagged with their case id or deleted, area by area.
