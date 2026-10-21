## 1. Register

- [x] 1.1 Catalog in `mods/conformance/catalog`: one markdown document per area (source), `lib.cjs` parser, `build.cjs` checks, ids lock, first draft archived
- [x] 1.1a Dashboard brought: 16 cases argued one by one with the owner, 15 tagged and proven in the mocked projects, 2 dead tests deleted; three spec changes and two bugs came out of it
- [x] 1.1b Dashboard real project: DSH-015 against `ops/rebuild/stack` (`npm run test:e2e:real`), nightly. Fixed on the way: stack `registry` key (#1011), `seed.cjs` shadowing + blind retries into the sign-in throttle, AppBridge image missing nested `ws`
- [ ] 1.1c Make the nightly `stack-smoke` run unconditionally on the schedule (the path filter let three stack breaks through)
- [x] 1.2 `runs` link and the two-way scenario file check
- [x] 1.3 Scenario-level coverage with the `uncovered-scenarios.txt` ratchet
- [ ] 1.4 Merge `docs/conformance.md` and the catalog README into one "Running the suites and reading the report"
- [ ] 1.5 `openspec validate unify-conformance-qa --strict` passes

## 1b. Review items (2026-10-20)

- [x] 1b.1 Spec: proven cases, flake policy, trials, tiers, production checks, relative measurements
- [x] 1b.2 Catalog: `proof`, `tier`, `trials` fields; PRD area; report shows Proven, flakes, quarantine, tiers
- [ ] 1b.3 Harness: seeded-fault run sets the `proven` JUnit property; rerun only marked-flaky; flake history store
- [ ] 1b.4 Production synthetic job after deploy with alerting

## 2. Harness

- [ ] 2.1 `src/harness`: `qa` wrapper (looks up the case, names the test, filters by tier), JUnit metrics helper
- [ ] 2.2 `src/harness`: `stack`, `bots` (sipcaller), `impair`, `scoring`, trunk fixtures
- [ ] 2.3 Go (`qa.Case`) and Python (`@qa_case`) equivalents

## 3. Convert tests, area by area

- [ ] 3.1 VSD, APB, ROM: tag existing conformance and Go tests; delete what no case covers
- [ ] 3.2 DSH: dashboard e2e into mocked and real projects, tagged
- [ ] 3.3 API, SEC, BRG, OPS, CAL, XFR, TRK, MQ, LDS, FLT: new suites, one area at a time

## 4. Release

- [ ] 4.1 CI: suites write JUnit to `reports/junit`; a release job runs `catalog/report.cjs`, attaches the report and fails on a red gate
