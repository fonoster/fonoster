# Conformance and QA catalog

One document per area, written for people, with the systems diagram, the tester, the unit under test
and the cases. No results live here: results are produced at release time by `report.cjs` and
attached to the release, where the gate decides.

| File | What it is |
| --- | --- |
| `areas/<area>.md` | The area document. Source of truth for its cases |
| `lib.cjs` | Parser shared by the two scripts |
| `build.cjs` | Checks the area documents and prints where each area stands |
| `report.cjs` | Builds the release report from JUnit results; exits 1 when the gate fails |
| `prove.cjs` | Applies each case's fault patch, runs the case, expects red, reverts; writes proof records |
| `faults/<ID>.patch` | The seeded fault of a case, applied by `prove.cjs` |
| `ids.lock.json` | Every case id with its name; ids are never reused or deleted |
| `retired.json` | Retired areas by prefix, with why; their ids stay in the lock and are never reused |
| `uncovered-scenarios.txt` | Spec scenarios in scope with no case; may only shrink |
| `tiers.json` | Generated for the harness: tier, priority, trials per case |
| `waivers.json`, `quarantine.json`, `flake-history.json` | Optional inputs to the report |
| `archive/` | Earlier drafts, kept for reference, not read by the scripts |

## Areas come one at a time

We bring one area, stay on it until the owner is happy, then the next. An area is brought when:

1. its document exists and `build.cjs` is green for it;
2. every existing test in its `tests:` files carries a case id, or was deleted;
3. every case has a proof and its test has been seen red on that proof;
4. its tier runs in CI and writes JUnit into `reports/junit`.

## The area document

```markdown
---
prefix: DSH                     # two to four capitals
title: Dashboard
level: L3 System (UI)
tier: pr                        # default for cases: pr | nightly | release | production
prove: <command>                # optional: runs one case ({id}), JUnit to {junit} or {junitDir}
reset: <command>                # optional: runs after each fault is reverted (PROVE_FILES set)
uut: ...
tester: ...
environment: ...
cadence: ...
capabilities:                   # spec capabilities this area covers; coverage is computed over them
  - dashboard
contracts:                      # optional: conformance scenario dirs this area owns (every file must be claimed by a case)
  - voice-sdk
tests:                          # globs; every test title in them must carry a case id
  - mods/dashboard/e2e/**/*.spec.ts
---

# Title

Scope paragraph.

## Systems

```mermaid ... ```

## Cases

### DSH-001 Name

- **Spec:** capability / requirement / scenario     (one or more; must exist in openspec/specs)
- **Priority:** P0
- **Tier:** nightly                                 (optional override)
- **Trials:** 3×1                                   (optional: k × required rate)
- **Runner:** dedicated                             (optional: a timing case, gated only on a dedicated runner)
- **Proof:** how the test is shown red
- **Fault:** faults/DSH-003.patch                   (optional: the proof as a patch, for prove.cjs)
- **Test:** path                                    (informational)
- **Runs:** scenarios/voice-sdk                     (contract cases: the scenario files this case runs)

Prose for people.

**Pass.** ... **Fail.** ...
```

Ids are explicit in the heading and permanent. A test is tied to a case by putting the id in its
title: `test("[DSH-003] signs out to a clean sign-in page", ...)`.

Two other ways, for tests whose titles aren't written by hand:

- **Scenario files.** A contract case lists its files with `Runs:`; a suite that runs scenario files
  builds each title with `scenarioCase(contract, name)` from `@fonoster/conformance`
  (`"[VSD-004] say-hello"`), and the Python SDK suite does the same with `case_for` in its
  `tests/conftest.py`.
- **Python tests.** Mark the test `@case("VSD-001")` (from the suite's `conftest.py`); the id is added
  to the test's name in the JUnit results, and `build.cjs` reads the decorator.

## The gate in CI

`.github/workflows/qa-proofs.yaml` (workflow "QA") has one job per area. Each runs every case once
(`run.cjs`) and proves every case on its fault (`prove.cjs`), and uploads its JUnit as `qa-<area>`. The
report job reads all of them, writes the release report and fails when the gate fails. It runs
nightly and on demand, and `release.yaml` calls it on the commit being released before anything is
published, then attaches the report to the GitHub release.

```sh
node mods/conformance/catalog/run.cjs --area DSH        # every case once, JUnit in reports/junit/run-DSH
```

`run.cjs` runs the area's `run:` command, or its `prove:` command with `{id}` set to a pattern matching
every case (`DSH-\d{3}`) and `QA_RUN=1`. A new area adds its job to the workflow and to the report
job's `needs`.

## The release report

```sh
node mods/conformance/catalog/report.cjs --results reports/junit --version v1.0.0 --sha "$(git rev-parse --short HEAD)" --out reports/qa-v1.0.0.md
```

Gate: every P0 passes and is proven (a `proven=true` JUnit property from a seeded-fault run); every
P1 passes or has an unexpired waiver; a case with no result is Not run and blocks; a skipped test is
Blocked, never Pass; stochastic cases are judged over their declared trials; quarantined tests are
Blocked and a quarantine older than 14 days fails the build. A timing case (`Runner: dedicated`, a
wall-clock bound) is gated only when the report is built from a dedicated runner's results
(`QA_DEDICATED_RUNNER=1`, which nothing sets yet); on shared runners its result is reported as a
trend, not gated. A test reports a number as a JUnit property or, when its reporter writes none, in
its name as `{metric=value}`; both land in the report's Measurements.

## Proofs

A case with a **Fault:** patch is proven by a machine:

```sh
node mods/conformance/catalog/prove.cjs --area API [--case API-003] [--out reports/junit/proofs-API.xml]
```

For each case it applies the patch, runs the area's `prove:` command for that case alone, and
reverts the patch. The case is proven only when the JUnit file the command wrote has a failing test
carrying the id; a fault that breaks the build proves nothing. It refuses to touch files with
uncommitted changes. The records it writes carry `proof=true` and `proven=true|false`; `report.cjs`
reads them for the Proven column and never counts them as runs. Make a fault with the change in the
working tree: `git diff > mods/conformance/catalog/faults/API-003.patch`, then `git checkout .`.

A P1 case with an unexpired waiver in `waivers.json` (`{ id, reason, approvedBy, expires }`) is not
proven: its test skips with a reason naming the waiver, the report shows it Waived, and `prove.cjs`
lists it as waived without counting it. Keep its fault patch for when the waiver lifts.

## Running the dashboard area

```sh
npm run test:e2e -w @fonoster/dashboard          # mocked projects, every pull request
ops/rebuild/stack up && ops/rebuild/stack seed    # once, then:
npm run test:e2e:real -w @fonoster/dashboard     # the real project (DSH-015), nightly
```

## Waiting for their area

Tests that use a real database, NATS or a gRPC server but belong to an area not brought yet. Each is
tagged with a case id, or deleted, when its area comes:

| Test | Area |
| --- | --- |
| `mods/apiserver/test/control/control.test.ts`, `control/sdk.test.ts` | Autopilot agents and webhooks (session apps, providers, webhooks) |
| `mods/apiserver/test/webhooks/fanout.test.ts`, `webhooks/sharedIntake.test.ts` | Webhooks |
| `mods/apiserver/test/regions/regions.test.ts`, `regions/relaySlots.test.ts` | Regions and private regions |
| `mods/apiserver/test/registry/spec.test.ts` | Provider registry |
| `mods/apiserver/test/outbound/placeOutboundCall.test.ts`, `outbound/controlPlane.test.ts` | Call flows |
| `mods/apiserver/test/core/healthcheck.test.ts`, `core/telemetryInterceptor.test.ts` | Deployment and observability |

## The rule

Every test that is not a unit test is a case in an area document. An existing test is converted
(tagged) or deleted. There are no manual tests. If a feature cannot be tested by a machine, the tool
that can is the first work item.
