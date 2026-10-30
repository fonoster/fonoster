## MODIFIED Requirements

### Requirement: Dev config generated once, secrets never committed

The dev config SHALL be produced in the git-ignored `.dev/` folder before the dependency containers
start: `.dev/config/` from the bundle's config files with the committed dev layer
(`.devcontainer/config/`) and the developer's `.dev/overlay/` deep-merged over them
(`ops/rebuild/merge-config.cjs`), then `ops/bundle/init.sh --dir .dev`, which writes `.dev/.env`
with generated secrets and the host address, the keys and the generated CA and server certificate
in `.dev/config/tls/`. Re-generating MUST keep every existing secret and the CA. The dev stack SHALL
serve the dashboard and API on `https://localhost` with that certificate, the same way an install
does, and the workspace's environment SHALL set `FONOSTER_CA_FILE` to `.dev/config/tls/ca.pem` so
the SDK, the CLI and the tests trust it without extra flags.

#### Scenario: First open
- **WHEN** the dev container is created and `.dev/` does not exist
- **THEN** `.dev/.env`, `.dev/config/*.yaml`, `.dev/config/keys/` and `.dev/config/tls/` exist and
  `git status` shows none of them

#### Scenario: Re-render keeps secrets
- **WHEN** `npm run dev:config` runs inside the workspace
- **THEN** every value in `.dev/.env` and the CA are unchanged, and the service files are the
  bundle's again with the dev layer and `.dev/overlay/` merged over them

#### Scenario: Dashboard over HTTPS
- **WHEN** a developer opens `https://localhost` after the dev stack starts and accepts the
  browser's certificate warning once
- **THEN** the dashboard loads and Talk to agent connects over `wss://localhost/sip`

#### Scenario: Tools trust the dev CA
- **WHEN** a developer runs the `fonoster` CLI or an SDK example against the dev stack inside the
  workspace
- **THEN** it connects over TLS without `--insecure` or `--ca-file`
