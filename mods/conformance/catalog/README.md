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
| `ids.lock.json` | Every case id with its name; ids are never reused or deleted |
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
- **Proof:** how the test is shown red
- **Test:** path                                    (informational)
- **Runs:** scenarios/voice-sdk                     (contract cases: the scenario files this case runs)

Prose for people.

**Pass.** ... **Fail.** ...
```

Ids are explicit in the heading and permanent. A test is tied to a case by putting the id in its
title: `test("[DSH-003] signs out to a clean sign-in page", ...)`.

## The release report

```sh
node mods/conformance/catalog/report.cjs --results reports/junit --version v1.0.0 --sha "$(git rev-parse --short HEAD)" --out reports/qa-v1.0.0.md
```

Gate: every P0 passes and is proven (a `proven=true` JUnit property from a seeded-fault run); every
P1 passes or has an unexpired waiver; a case with no result is Not run and blocks; a skipped test is
Blocked, never Pass; stochastic cases are judged over their declared trials; quarantined tests are
Blocked and a quarantine older than 14 days fails the build.

## Running the dashboard area

```sh
npm run test:e2e -w @fonoster/dashboard          # mocked projects, every pull request
ops/rebuild/stack up && ops/rebuild/stack seed    # once, then:
npm run test:e2e:real -w @fonoster/dashboard     # the real project (DSH-015), nightly
```

## The rule

Every test that is not a unit test is a case in an area document. An existing test is converted
(tagged) or deleted. There are no manual tests. If a feature cannot be tested by a machine, the tool
that can is the first work item.
