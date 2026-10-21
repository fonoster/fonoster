# Design

## Two axes, not one

- **Area** is how we test: the tester, the unit under test, the diagram, the environment and the
  cadence. Work is planned and done per area (DSH, API, VSD, CAL, XFR, TRK, ROM, MQ, LDS, APB, FLT,
  SEC, BRG, OPS).
- **Capability and scenario** is what the platform promises: `openspec/specs`. The coverage gate
  runs on this axis. One capability is usually tested from several areas.

## Contract cases and scenario files

A contract-backed case carries `runs: ["scenarios/<contract>"]`. Its prose (objective, steps, pass
and fail) is for people, and the scenario files are what runs. The build checks both directions: a
`runs` path with no files fails, and a scenario file claimed by no case fails. A scenario file already
carries `spec: "<requirement> / <scenario>"`, which gives scenario-level coverage with no new field.

## Ratchet

`uncovered-scenarios.txt` lists every spec scenario that no test covers. The build fails when a
scenario is uncovered and not listed (a new requirement without a test), and when a listed scenario
is now covered (the list must shrink). Today 167 of 648 scenarios are covered (26%).

## Ids

Ids are `<area prefix>-<nnn>` by position in the area file. They are carried in test names, so they
must not move: `ids.lock.json` rejects a removed id, and a renamed or new case needs `--update-lock`.

## What confidence actually rests on (review 2026-10-20)

The catalog is an inventory. Confidence comes from three things the report tracks separately:
proven cases (seen red on a seeded fault), a bounded flake rate, and a production signal. Sources
and the reasoning are in `docs/test-plan.md`, "Review".

- Proven: coverage and mutation scores are weak predictors of fault detection for LLM-written tests;
  a test must be seen red before it counts.
- Flake policy: at Google scale ~16% of tests show flakiness and 84% of pass-to-fail transitions
  involve a flaky test; a gate with no policy blocks every release or gets ignored.
- Tiers: the DORA finding is that AI pays off with fast feedback; most of this catalog is nightly.
- Production: Anthropic's postmortems found pre-release evals missed what continuous production
  checks catch.

## Left open

- The `case` id on scenario files is not needed while `runs` is the link. Revisit if one directory
  holds cases of different areas.
- Docs-versus-spec auditing is a separate change.
