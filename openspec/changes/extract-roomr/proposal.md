## Why

Roomr (the Go SIP and media node) has its own contract, its own tests and its own audience, and it
deserves its own lifecycle: releases, specs, docs and a README of its own. In this repository it
shares CI, release gates and QA tooling with everything else, and Fonoster ends up testing Roomr's
internals (a Go toolchain with libopus in CI, 14 conformance files that drive the real node).

## What changes

- Roomr moves to **github.com/fonoster/roomr** (public, MIT), with its git history, its own
  OpenSpec (the `roomr` and `media-control` specs), docs (README, architecture, contract,
  integration guide), CI, release pipeline, Helm chart and fake.
- Fonoster consumes three things from Roomr: the **contract** (the two protos, vendored and pinned to
  a release tag), a **pinned image** (by digest) and the **fake** (`fonoster/roomr-fake`).
- Fonoster no longer builds, tests or inspects Roomr's internals. Node-level QA (the ROM area's node
  cases) moves to Roomr; Fonoster keeps integration cases against the fake and one smoke against the
  real image in the release gate.

## Decisions (made 2026-10-22)

1. `fonoster/roomr`, public, MIT. 2. The fake is a Go image plus an npm client; one contract suite
runs against the real node and the fake. 3. Protos are vendored, pinned to a tag, with a drift check.
4. Roomr owns the Helm chart. 5. History is preserved. 6. Images on Docker Hub (`fonoster/roomr`,
`fonoster/roomr-fake`). 7. Open Roomr tasks are filed as issues after the move.

## Impact

Removes `go/roomr`, the Go CI jobs and `mods/conformance/src/roomr` node tooling; changes
compose, Helm, bundle and devcontainer to pull the image; the release QA gate checks that the pinned
Roomr version has a passing QA report instead of running the node cases.
