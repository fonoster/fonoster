# Tasks

## 1. Spec

- [x] 1.1 Proposal, design and spec; `openspec validate revamp-developer-experience --strict`

## 2. Dev container

- [ ] 2.1 `.devcontainer/compose.yaml`: workspace + bundle dependencies (`extends`), test NATS, test database
- [ ] 2.2 `.devcontainer/Dockerfile`: Node 22, Go 1.25 (`GOTOOLCHAIN=local`), protoc
- [ ] 2.3 `.devcontainer/initialize.sh`: host address, `fonoster-config init` into `.dev/`, dev layer
- [ ] 2.4 `.devcontainer/post-create.sh`: `npm ci`, build, Go modules, dev config, Playwright, info

## 3. Dev scripts

- [ ] 3.1 `.scripts/dev.mjs` runner: env from `.dev/.env`, prefixed logs, all or one component
- [ ] 3.2 apiserver (migrate once, then `tsx watch`), gateway, Autopilot, fakes, dashboard (Vite)
- [ ] 3.3 media node: `go build` + restart on `.go` changes
- [ ] 3.4 `dev:config` re-render; dashboard `/config.js` from the environment; Envoy HMR upgrade

## 4. Clean-up

- [ ] 4.1 Remove `compose.dev.yaml`, `.env.example.dev`, legacy scripts and helpers
- [ ] 4.2 CI and docs that referenced them; CONTRIBUTING.md to the single path

## 5. Verify

- [ ] 5.1 Dev container up under a trial project: deps healthy, post-create, `npm run dev`
- [ ] 5.2 Sign in through the SDK, one call to an Autopilot app, a gateway reload
- [ ] 5.3 Tests inside the workspace (`npm test`, Go); lint and format
