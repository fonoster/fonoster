## Context

The rebuild ships Fonoster as a self-host bundle (`ops/bundle`: Compose file, `config/*.example.*`,
`fonoster-config init`). Developing it needs the same dependencies (Postgres, NATS with per-service
users, Routr with the WebSocket transport and the media-node peer, RTPEngine in passive DTLS mode,
MinIO, Envoy routing gRPC/gRPC-Web, `/api`, `/sip` and the dashboard) while the components we write
run from source. The owner decided (2026-10-16) that the dev container is the only way to develop,
that dependencies run as containers and our components from source with reload.

## Goals / Non-Goals

- Goals: one path (open the dev container, `npm run dev`); dependencies start with the container;
  bundle parity (same images, same service definitions, same config files); one script per
  component; tests run inside the container; no host tooling beyond Docker and a dev-container
  client.
- Non-goals: a production deployment; Kubernetes; replacing `ops/rebuild/stack` for CI smoke runs;
  docs-site pages (written separately).

## Decisions

### D1. Compose-based dev container that reuses the bundle's services

`.devcontainer/devcontainer.json` points at `.devcontainer/compose.yaml` (`dockerComposeFile`,
`service: workspace`, `runServices`). That file defines `workspace` and takes `nats`, `postgres`,
`routr`, `rtpengine`, `minio` and `envoy` from `ops/bundle/compose.yaml` with `extends`, so image
versions, environment, health checks, fixed addresses and port publishing come from the bundle.
Dev-only differences are overrides in the same file: Envoy's `depends_on` is reset (the apiserver is
not a container in dev), Postgres mounts one more init script (the test database).

- Alternatives: `include` of the whole bundle (pulls in our own services and their dependencies,
  which then must be disabled one by one); a second hand-written Compose file (drifts);
  docker-outside-of-docker from a single-container dev container (the old setup: host path tricks,
  `--add-host` aliases, ports published on the host for the container to reach).

### D2. The workspace stands in for our services on the network

The workspace joins the bundle's network at the media node's fixed address (`<prefix>.42`) with
the aliases `apiserver`, `gateway`, `autopilot`, `medianode`, `dashboard` and `fakes`. The bundle's
Envoy routes (`apiserver:50051`, `apiserver:9876`, `dashboard:3030`), `apps.autopilotUrl`
(`ws://autopilot:3000`) and the media node's advertised address work unchanged. The workspace
mounts `.dev/config` where the bundle's containers find their files (`/config`, `/etc/fonoster`,
`/opt/fonoster/keys`), so the services find their config and keys with no flags.

### D3. Dev config: `fonoster-config init` into `.dev/`, before the containers start

Compose interpolates the bundle's `${POSTGRES_PASSWORD:?run fonoster-config init}` (and the other
secrets) when it reads the file, and RTPEngine/Routr need the host's LAN address, which is only
visible from the host. So the dev config must exist before the containers are created:
`initializeCommand` (runs on the host) calls `.devcontainer/initialize.sh`, which needs only a POSIX
shell and Docker. On the first open it detects the host address and runs the real
`fonoster-config init` (from source, in a throwaway `node:22-alpine` container) on `.dev/` (a copy
of `ops/bundle/.env.example` with the dev defaults and of `ops/bundle/config/`), then renders the
dev layer. Later opens keep `.dev/` as it is. `npm run dev:config` re-runs init and render inside
the workspace (keeps every secret). `.devcontainer/.env` is a link to `.dev/.env` so Compose reads
the same values.

- Alternatives: committed dev secrets (rejected: secrets are generated, never committed); running
  init in post-create (too late for Compose interpolation and for the dependency containers);
  duplicating init in shell (drifts from the installer).

### D4. A committed dev layer over the rendered files

`.devcontainer/config/*.yaml` are overlays deep-merged by `fonoster-config render` (the same
mechanism the rebuild stack uses): fake speech and language-model providers on the workspace
(`testMode: true`), the gateway's RTP address on the workspace. A contributor's own overrides go in
`.dev/overlay/` (git-ignored, merged last).

### D5. One runner for the dev scripts

`.scripts/dev.mjs` (Node, no dependencies) loads `.dev/.env` (with `${NAME}` expansion, like
Compose's `env_file`) into each process it starts and prefixes each line with the component's name.
`npm run dev` starts every component; `npm run dev:<component>` one. TypeScript services use
`tsx watch` (already a dev dependency); the media node is rebuilt with `go build` and restarted when
a `.go` file changes (`fs.watch`, no new tool); the dashboard is Vite. The apiserver applies its
migrations and seed once with its own entrypoint (`--migrate-only`), then serves under `tsx watch`.

- Alternatives: `concurrently` / `npm-run-all` (not in the lockfile; a new dependency for ~100
  lines), `air`/`reflex` for Go (a new tool in the image), the secrets in the workspace's
  environment through `env_file` (every shell and test would see them, and a change would need a
  container rebuild).

### D6. Tests get their own dependencies

A plain `nats-test` (JetStream, no users) serves the conformance suite, so test gateways never claim
calls placed against the dev stack, and Postgres creates a `fonoster_test` database at first start.
The workspace's environment sets `CONFORMANCE_NATS_URL` and `PERSISTENCE_TEST_DATABASE_URL` to them.
The workspace has no Docker CLI: the default suites do not start containers (the opt-in NATS ACL and
Routr live tests document their own setup).

### D7. Legacy paths removed; the stack stays a harness

`compose.dev.yaml`, `.env.example.dev`, the legacy scripts and CONTRIBUTING sections go. CI jobs
that copied `.env.example.dev` stop doing so (`npm test` no longer requires a root `.env`).
`ops/rebuild/stack` and the root `compose.yaml` keep working for `smoke` and CI.

### D8. Dashboard reachable through Envoy with HMR

The dashboard is opened at `http://localhost:<HTTP_PORT>` (Envoy), the origin the bundle uses and
the one browsers accept for the microphone. Vite serves `/config.js` from `DASHBOARD_API_URL` in dev
(the runner sets it to `PUBLIC_URL`), and the bundle's Envoy route to the dashboard allows the
WebSocket upgrade so Vite's HMR works through it (nginx in production ignores it).

## Risks / Trade-offs

- The first open runs `npm ci` and a full build (several minutes). Later opens are fast.
- A git worktree checkout cannot use git inside the container (its `.git` points at a host path).
- RTPEngine needs the host's LAN address; if it changes, `FONOSTER_DEV_HOST_IP=<addr>` and a
  rebuild of the dev container (or editing `HOST_IP` in `.dev/.env`) fixes it.
