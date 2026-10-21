# Spec Delta

## ADDED Requirements

### Requirement: The catalog is the single register of non-unit tests

Every test that is not a unit test SHALL be a case in the catalog (`mods/conformance/catalog/areas`).
A case SHALL have an id, a name, an objective, preconditions, numbered steps, pass criteria, fail
criteria, a priority and a reference to the spec capability it covers. Each area SHALL name its
tester and its unit under test, show the systems involved in a diagram, and state its environment
and cadence. A test that runs in CI, nightly or at a release gate SHALL carry its case id in its
name.

#### Scenario: A test without a case

- **WHEN** a non-unit test exists and no catalog case names it
- **THEN** it is converted to a case or deleted before it can merge

#### Scenario: A case is complete

- **WHEN** the catalog is built and a case lacks a required field
- **THEN** the build fails and names the case

### Requirement: There are no manual tests

Every case SHALL be run by a machine, in CI, nightly or at a release gate. The catalog SHALL NOT
describe a case as run by a person. A feature that a machine cannot yet test SHALL first get the tool
that can.

#### Scenario: Manual wording

- **WHEN** a case says it is run manually, by hand or by a person
- **THEN** the build fails

### Requirement: Every capability and scenario has a test

Every capability in `openspec/specs` SHALL be referenced by at least one case. Every spec scenario
SHALL be run by a conformance scenario file (its `spec:` field), named in a case's `covers`, or be
listed in `uncovered-scenarios.txt`. The list SHALL only shrink.

#### Scenario: A capability without a case

- **WHEN** a capability has no case that references it
- **THEN** the build fails and names the capability

#### Scenario: A new spec scenario without a test

- **WHEN** a spec scenario is added and no test covers it
- **THEN** the build fails until a test covers it

#### Scenario: A listed scenario becomes covered

- **WHEN** a scenario in `uncovered-scenarios.txt` is now covered
- **THEN** the build fails until the list is updated

### Requirement: Contract cases run conformance scenarios

A case MAY declare `runs`, a list of paths under `mods/conformance`. The build SHALL fail when a path
matches no scenario file, and when a scenario file belongs to no case.

#### Scenario: An orphan scenario file

- **WHEN** a scenario file is added and no case's `runs` includes it
- **THEN** the build fails and names the file

### Requirement: Case ids are stable

A case id SHALL be its area prefix and its position in the area file. The catalog SHALL keep every id
and its name in `ids.lock.json`. A removed id SHALL fail the build. A new or renamed case SHALL need an
explicit lock update.

#### Scenario: A case is inserted

- **WHEN** a case is inserted before others in an area file
- **THEN** the ids of the later cases change and the build fails

### Requirement: Release report and gate

The release process SHALL build a markdown report from the JUnit results, with the version and git
SHA. The gate SHALL pass only when every P0 case passes and every P1 case passes or has an unexpired
waiver. A case with no result SHALL count as Not run and block the release. A skipped test SHALL count
as Blocked, never as Pass.

#### Scenario: A P0 case has no result

- **WHEN** the report is built and a P0 case has no result
- **THEN** the gate fails and the case is listed under "Blocking the release"

#### Scenario: A waiver expires

- **WHEN** a P1 case fails and its waiver is past its expiry date
- **THEN** the gate fails

### Requirement: Trunking is tested with one generic suite

Trunking SHALL be tested by one suite for any SIP trunking provider, selected by a fixture that names
the trunk settings, two numbers and a capability matrix. The suite SHALL run in reference mode
against a local trunk simulator and in live mode against a real provider, with the same cases. The
live mode SHALL stop at a daily spend limit and report the cases it did not run as Blocked.

#### Scenario: Behavior differs from the declared matrix

- **WHEN** a provider's observed behavior differs from its capability matrix
- **THEN** the case fails and names the difference

### Requirement: A case is proven before it counts

A test SHALL be shown to fail against a seeded fault before it can be merged: a fault switch in a
fake, a mutated configuration, a reverted fix, or a corrupted input, declared on the case as `proof`.
The report SHALL count Proven cases separately from Pass. A green test that has never been seen red
SHALL count as Unproven, and the release gate SHALL treat an Unproven P0 as not passing.

#### Scenario: A new test is green but never red

- **WHEN** a test is added and its JUnit result carries no `proven` property from a seeded-fault run
- **THEN** the report lists the case as Unproven and a P0 case blocks the release

#### Scenario: An assertion is weakened

- **WHEN** a change to a test makes its seeded-fault run pass
- **THEN** the proof check fails and the change cannot merge

### Requirement: Flaky tests are marked by data and rerun once

A test SHALL be marked flaky only by data: both outcomes on the same commit, recorded in the flake
history. Only a marked-flaky test MAY be rerun, once. A pass after a rerun SHALL count a flake
against the test. The report SHALL show the flake rate per area.

#### Scenario: An unmarked test fails once

- **WHEN** a test not marked flaky fails
- **THEN** it is not rerun and the result is Fail

#### Scenario: A marked test passes on rerun

- **WHEN** a marked-flaky test fails, is rerun once and passes
- **THEN** the result is Pass and the flake history records one more flake

### Requirement: Quarantine is time-boxed

A test over the flake threshold SHALL be quarantined: it keeps running, reports as Blocked, and
counts toward no gate. Quarantine SHALL expire after fourteen days, after which the test is fixed or
deleted and its case returns to uncovered. The report SHALL list the tests in quarantine and their age.

#### Scenario: Quarantine expires

- **WHEN** a quarantined test is still quarantined after fourteen days
- **THEN** the report fails the build until the test is fixed or removed

#### Scenario: A quarantined P0

- **WHEN** a P0 case is in quarantine at release time
- **THEN** it reports as Blocked and the gate fails

### Requirement: Stochastic cases declare trials

A case whose unit under test is not deterministic (turn-taking, Autopilot, media quality, timing)
SHALL declare `trials`: the number of runs `k` and the required rate. Its result SHALL be computed
over all `k` runs (pass^k when the rate is 1). A case that passes some runs and fails others SHALL be
reported as failing its declared bar, not as flaky.

#### Scenario: Four of five

- **WHEN** a case declares `k: 5, rate: 1` and passes four runs
- **THEN** the result is Fail

### Requirement: Tiers bound feedback time

Every case SHALL belong to a tier: `pr`, `nightly`, `release` or `production`. The `pr` tier SHALL
finish in under fifteen minutes on the shared runners and SHALL contain only cases that run on fakes
or mocks. The report SHALL state the wall time of the last `pr` run.

#### Scenario: The PR tier is too slow

- **WHEN** the `pr` tier takes longer than fifteen minutes
- **THEN** the build reports it and the slowest cases are moved to `nightly` or made faster

### Requirement: Production is checked continuously

After every deploy, and on a schedule, synthetic checks SHALL run against production: an inbound
call, an outbound call, DTMF, a transfer, one Autopilot turn and a dashboard sign-in. A failure SHALL
alert. These cases belong to the `production` tier and SHALL appear in the report.

#### Scenario: A deploy breaks inbound calls

- **WHEN** the post-deploy inbound check fails
- **THEN** an alert is raised within the check's timeout and the case shows as Fail in the next report

### Requirement: Measurements are relative and run on known hardware

Media-quality and timing cases SHALL report scores relative to a committed baseline, never as
absolute quality claims. Their pass bars SHALL apply only on the dedicated runner; on shared runners
they SHALL be reported as trends and SHALL NOT gate.

#### Scenario: Timing on a shared runner

- **WHEN** a timing case runs on a shared runner
- **THEN** its numbers appear under Measurements and its result does not affect the gate
