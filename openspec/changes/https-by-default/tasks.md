# Tasks

## 1. Spike (before building)

- [x] 1.1 With a local CA and server certificate for `localhost`, no HSTS: confirm Chrome and Safari
      allow clicking through the warning, `navigator.mediaDevices.getUserMedia` works on the page, and
      Talk to agent connects over `wss://localhost/sip`. Record results and screenshots. (Chrome passed on `localhost` and `127.0.0.1`, both
      libraries; Safari still needs the owner's manual check.)
- [x] 1.2 Confirm that with HSTS sent, the warning can't be bypassed (proves Decision 4).
- [x] 1.3 Check whether grpc-js honors `GRPC_DEFAULT_SSL_ROOTS_FILE_PATH` and/or `NODE_EXTRA_CA_CERTS`,
      and whether Node `fetch` honors `NODE_EXTRA_CA_CERTS`; note it for the docs.
- [x] 1.4 Choose the X.509 library (`@peculiar/x509` vs `node-forge`): bundle size, API, ECDSA support,
      Envoy compatibility. Update design.md Decision 2 and close the open question. Outcome: neither, Node's
      built-in crypto with a minimal DER writer (no new dependency; node-forge fails the production audit).

## 2. Certificate generation in init

- [x] 2.1 Generate `config/tls/ca.pem` + `ca-key.pem` (10 years) and `server.pem` + `server-key.pem`
      (397 days) when `TLS_CERT`/`TLS_KEY` are unset; names: `localhost`, `127.0.0.1`, `HOST_IP`, the
      `PUBLIC_URL` host. Key files 0600; certificates readable by the containers.
- [x] 2.2 Re-run rules: keep the CA byte for byte; reissue the server certificate only when names change
      or it expires within 30 days; generate nothing when `TLS_CERT`/`TLS_KEY` are set.
- [x] 2.3 `info`: print `ca.pem` path, its SHA-256 fingerprint and the getting-started notice when the
      generated certificate is in use; nothing extra with the owner's certificate.
- [x] 2.4 `check`/exposure warnings: warn when `PUBLIC_URL` is a public domain still on the generated
      certificate. Replacing the plain-HTTP warning moves to 4.1: plain HTTP stays the default until then.
- [x] 2.5 Make sure `config/tls/` is never in the release archive (`ops/release/bundle`) and is git-ignored
      wherever a config folder is (`.dev/`, `ops/bundle`).
- [x] 2.6 Tests in `mods/common/test/config/cli/fonosterConfig.test.ts` for 2.1–2.4.

## 3. API clients trust a CA file

- [x] 3.1 SDK (Node): `caFile` client option → `credentials.createSsl(ca)` for gRPC and the same CA for
      HTTP calls; default from `FONOSTER_CA_FILE`; missing file fails before connecting, naming the path.
- [x] 3.2 CLI: `--ca-file` on `workspaces login`, saved with the workspace and reused; `FONOSTER_CA_FILE`
      fallback; flag wins; certificate errors suggest `--ca-file`.
- [x] 3.3 Region agent: `--ca-file` and `FONOSTER_CA_FILE` for the control plane URL.
- [x] 3.4 MCP server: CA from `FONOSTER_CA_FILE` through the SDK option.
- [x] 3.5 Tests for 3.1–3.4: trusted CA succeeds, no CA fails with the hint, wrong host name fails,
      missing file fails, flag beats env var.

## 3b. Remove the user-facing insecure options

- [x] 3b.1 Remove the CLI's `--insecure` (unknown flag, hint to `--ca-file`) and the MCP server's
      `MCP_ALLOW_INSECURE`; move their callers and docs to `--ca-file` / `FONOSTER_CA_FILE`.
- [x] 3b.2 Document the SDK's `allowInsecure` and the region agent's `--allow-insecure` as
      private-network only; make sure no error message or doc suggests them for the generated certificate.
- [x] 3b.3 Tests: `--insecure` is rejected with the hint; the CLI fails with a TLS error on a plain-HTTP
      endpoint; certificate errors suggest `--ca-file`.

## 4. HTTPS by default in the bundle

- [x] 4.1 `compose.yaml` serves HTTPS (TLS Envoy config, 443/80 via `HTTPS_PORT`/`HTTPS_REDIRECT_PORT`,
      `TLS_CERT`/`TLS_KEY` defaulting to the generated files); new `compose.http.yaml` turns HTTPS off;
      `compose.tls.yaml` kept as an empty compatibility file. Replace the plain-HTTP exposure warning with
      the getting-started notice (moved from 2.4).
- [x] 4.2 HSTS only with the owner's certificate (`init` renders the Envoy config accordingly).
      (Built as Compose interpolation, not an `init` render: `HSTS: ${TLS_CERT:+max-age=31536000}` and
      the Envoy entrypoint drops the marked HSTS lines when it is empty.)
- [x] 4.3 `.env.example`: `PUBLIC_URL` defaults to `https://${HOST_IP}`; document `compose.http.yaml`.
- [x] 4.4 Upgrade rules (Decision 5): rewrite `PUBLIC_URL` only when it equals the old default; warn and
      point to `compose.http.yaml` when it was edited; print what changed.
- [x] 4.5 Audit services that call the install's own public `https://` address; give them the CA.
      (Audited: no service calls the install's own public address; the API server uses it only for
      redirects, links, the enrollment issuer and the secure-cookie flag. Remote region agents use
      `--ca-file` from stage B.)
- [x] 4.6 Conformance: bundle tests for the HTTPS default, the opt-out, the upgrade rules and the
      archive; DSH-063 runs against the default stack (no separate TLS switch needed).
      (The release smoke test, `ops/release/smoke`, now checks the default: 200 through the generated
      CA, no HSTS, the redirect. DSH-063 keeps running through `stack tls on`: the QA stack stays on
      plain HTTP, see 5.3.)

## 5. Dev container on https://localhost

- [x] 5.1 Dev config generation produces `.dev/config/tls/`; the dev stack serves `https://localhost`.
- [x] 5.2 Workspace environment sets `FONOSTER_CA_FILE=.dev/config/tls/ca.pem`; CLI, SDK examples and
      tests connect without `--insecure`.
- [x] 5.3 Playwright and the conformance harness work against `https://localhost` (trust the CA or keep
      `ignoreHTTPSErrors`); retire `ops/rebuild/stack tls on|off` if the default makes it redundant.
      (Not retired: the rebuild stack and the root `compose.yaml` are the QA/CI harness, which talks
      plain HTTP on `RB_API_PORT`, so they add `compose.http.yaml`; `stack tls on` keeps exercising the
      HTTPS path for DSH-063. The dev container itself serves `https://localhost:8449`.)

## 6. Docs

- [x] 6.1 Install guide: HTTPS from the first start, the one-time browser warning, `ca.pem` for API
      clients, "use a real certificate before going live", and `compose.http.yaml` for a TLS proxy in front.
- [x] 6.2 HTTPS page: lead with "replace the generated certificate", keep certbot as the worked example,
      note HSTS turns on with a real certificate.
- [x] 6.3 Dev-container page, SDK, CLI, MCP and region references: `caFile`, `--ca-file`,
      `FONOSTER_CA_FILE`; remove every mention of the insecure options.
- [x] 6.4 Release notes call out both breaking changes (HTTPS default; CLI `--insecure` and
      `MCP_ALLOW_INSECURE` removed) and the rollback for the default (`compose.http.yaml`).
      (In the stage C PR body; release notes are generated from commits.)

## Workflow follow-up

- Sync specs and archive the change after it ships (`/opsx:archive`).
