# Design

## Context

The Compose bundle serves plain HTTP on `HTTP_PORT` (8449) unless the owner adds `compose.tls.yaml`
with their own `TLS_CERT` and `TLS_KEY`. Browsers block the microphone on plain HTTP to anything but
`localhost`, so a first install on a server can't do browser calls, and the dev container never
exercises the HTTPS path (the WSS bug fixed in #1134 reached production that way). The owner's
decision (2026-10-25): HTTPS always on, with a generated local CA when no certificate is given,
explicit CA trust for API clients, for getting started only. Real certificates (Let's Encrypt, the
HTTPS page) before going live.

## Goals / Non-Goals

**Goals:**
- A fresh install, on a server or in the dev container, serves HTTPS from its first start, and Talk
  to agent works after one browser warning.
- API clients (SDK, CLI, region agent) verify the generated certificate through an explicit CA file,
  with no plain-HTTP fallback.
- One mechanism for operators and developers; owner-provided certificates keep working unchanged.

**Non-Goals:**
- Automatic Let's Encrypt (ACME) or `sslip.io` certificates. Possible later upgrade.
- Installing the CA into operating-system or browser trust stores.
- SIP over TLS (5061) and RTP encryption: unchanged.
- Making the generated certificate suitable for production.

## Decisions

### 1. A local CA plus a server certificate, not a single self-signed certificate
Clients trust `ca.pem` once. `init` reissues the server certificate when names change (new
`PUBLIC_URL` host, new `HOST_IP`) or it's within 30 days of expiry, and clients keep working with the
same `ca.pem`. A single self-signed certificate would force every client to fetch a new file on each
change. CA: 10 years. Server certificate: 397 days.

### 2. Generated with Node's built-in crypto, no certificate library
`init` must not need `openssl` (self-host-installer spec), and `@fonoster/common` must not add a
dependency: every `@fonoster/sdk` user installs it. Node's `crypto` makes the keys
(`generateKeyPairSync`, ECDSA P-256), signs (`crypto.sign`, ecdsa-with-SHA256, DER signatures) and
reads and verifies certificates (`crypto.X509Certificate`: names, expiry, `checkIssued`, `verify`).
The one thing it lacks is building a certificate, so `mods/common/src/config/cli/x509.ts` writes the
minimal DER for an X.509 v3 TBSCertificate: version, serial, signature algorithm, issuer and subject
CN, validity, SPKI (from `key.export({ type: "spki", format: "der" })`), and the extensions
basicConstraints, keyUsage, extKeyUsage serverAuth, subjectAltName (DNS and IP), and subject/authority
key identifiers. It only ever writes certificates, never parses untrusted ones.

Rejected (spike, 2026-10-25): `node-forge` worked (RSA 2048) but CI's production-dependency audit
flags it with a high advisory that no version fixes (GHSA-86w9-cpqp-85rv), which every SDK user's
`npm audit` would show. `@peculiar/x509` worked (ECDSA P-256) but pulls in about 4.6 MB of
dependencies and the global `reflect-metadata` polyfill. Envoy 1.35, `openssl verify` and `curl
--cacert` accept the hand-built ECDSA certificates (DNS and IPv4/IPv6 SANs); Chrome and Safari
accepted the spike's certificates after the click-through.

### 3. HTTPS becomes the base `compose.yaml`; plain HTTP is the overlay
Today TLS is the `compose.tls.yaml` overlay. It flips:
- `compose.yaml` mounts the TLS Envoy config and publishes 443 and 80 (`HTTPS_PORT`,
  `HTTPS_REDIRECT_PORT`). `TLS_CERT`/`TLS_KEY` default to `config/tls/server.pem` and
  `config/tls/server-key.pem`.
- A new `compose.http.yaml` overlay turns HTTPS off: plain Envoy config on `HTTP_PORT`, for an owner
  with their own TLS proxy in front (`HTTP_BIND=127.0.0.1`).
- `compose.tls.yaml` stays as an empty compatibility file, so existing `.env` files with
  `COMPOSE_FILE=compose.yaml:compose.tls.yaml` (fnai) keep working unchanged.

### 4. No HSTS with the generated certificate
Envoy's TLS config sends `strict-transport-security: max-age=31536000`. Spike (Chrome): when a host has
an HSTS entry, Chrome removes the "proceed" link from the certificate warning and the page can't be
reached. Chrome ignores HSTS headers that arrive over an untrusted connection, so the generated
certificate alone never creates an entry. The risk is an entry left from an earlier trusted visit to
the same host (a developer who once trusted another certificate for `localhost`, or a domain that
goes back from Let's Encrypt to the generated certificate). Envoy sends HSTS only when the owner's
certificate is in use (`init` renders that choice), and the docs say how to clear a stale entry
(`chrome://net-internals/#hsts`).

### 5. Upgrading existing installs
`init` keeps owner values (self-host-installer spec). Existing installs:
- With `TLS_CERT`/`TLS_KEY` set: unchanged; `init` generates nothing.
- Plain HTTP with `PUBLIC_URL` still equal to the old default `http://${HOST_IP}:${HTTP_PORT}`:
  treated as not owner-edited; `init` updates it to the new default `https://${HOST_IP}`,
  generates the CA, and the install switches to HTTPS on the next `up -d`. `init` prints what
  changed.
- Plain HTTP with an owner-edited `PUBLIC_URL`: `init` leaves it, warns that HTTPS is now the
  default, and points to `compose.http.yaml` to stay on plain HTTP.

### 6. Clients
- SDK (Node): a `caFile` client option. The gRPC channel uses `credentials.createSsl(ca)`; host names
  are still verified (spike: a name mismatch fails). Node's global `fetch` has no CA option, so HTTP
  calls pass the CA through an undici `Agent` (`connect.ca`, matching Node's bundled undici major) or
  `https.request` with `ca`. Default: `process.env.FONOSTER_CA_FILE`. The browser `WebClient` is
  unchanged (the browser trusts or warns).
- CLI: `--ca-file` on `workspaces login`, saved with the workspace so later commands reuse it;
  `FONOSTER_CA_FILE` when no flag is given. Certificate errors suggest `--ca-file`.
- Region agent: `--ca-file`, plus `FONOSTER_CA_FILE`. It applies to the control plane URL. The hub's
  `tls://` leaf connection keeps its own certificates.
- MCP server: the same SDK option, from `FONOSTER_CA_FILE`.
- Removed, owner decision 2026-10-25: the CLI's `--insecure` (rejected as an unknown flag with a hint
  to `--ca-file`) and the MCP server's `MCP_ALLOW_INSECURE`. User-facing tools always use TLS.
- Kept, for private networks only: the SDK's `allowInsecure` and the region agent's `--allow-insecure`
  (service to service, in-process tests, `ops/rebuild/e2e.cjs`, the Helm chart's in-cluster region
  agent). Their docs say so, and no error message suggests them. Removing them too was considered and
  rejected: it would need TLS on every internal port or a test-only bypass.
- Webhook delivery to `http://` URLs (`allowInsecureUrls`) and the dev stack's plain NATS leaf
  (`allowInsecureLeaf`) are not client connections to the API and stay as they are.

### 7. Services that call the public address
Audit, then give any service that calls the install's own `https://` address (rather than an
internal Docker name) the CA through `FONOSTER_CA_FILE` or its config. Known candidate: a region
agent on the same host whose control plane URL defaults to `PUBLIC_URL`.

### 8. Dev container
The dev config (`.dev/`) runs the same `init`, so it gets `.dev/config/tls/`. The dev stack serves
`https://localhost`. The workspace sets `FONOSTER_CA_FILE=.dev/config/tls/ca.pem`, so the CLI, SDK
examples and tests trust it with no flags. Playwright keeps `ignoreHTTPSErrors` (or trusts the CA).

## Risks / Trade-offs

- **The microphone or WSS may not work after a click-through warning in some browser** → the spike
  checks Chrome and Safari first. If one fails, document a workaround (trust `ca.pem` in that browser),
  or revisit before building.
- **Third-party Node clients** → spike: grpc-js and `fetch` both honor `NODE_EXTRA_CA_CERTS` (read at
  process start, so `FONOSTER_CA_FILE` can't be implemented by setting it from code; we pass the CA
  explicitly). `GRPC_DEFAULT_SSL_ROOTS_FILE_PATH` works for grpc-js only and replaces the system
  roots. The docs recommend `NODE_EXTRA_CA_CERTS=ca.pem` for anyone else's Node client.
- **Click-through browser behavior** → verified in the spike: Chrome (automated) and Safari (owner,
  2026-10-25) both give a secure context, the microphone and same-origin WSS after the warning.
- **Port 443 clashes on a developer's machine** → `HTTPS_PORT` is configurable (since #1134).
- **People go live on the generated certificate** → `init`, `info` and the docs say it's for getting
  started; `check` warns when `PUBLIC_URL` is a public domain still using it.
- **Breaking change for plain-HTTP installs on upgrade** → Decision 5 limits it to installs still on
  the old default. Documented in the release notes and the install guide.

## Migration Plan

1. Spike (Chrome/Safari mic + WSS past the warning; grpc-js trust; library choice).
2. Certificate generation in `init` (+ `info`/`check`) behind the current overlay, so nothing changes
   for existing installs yet.
3. Clients' CA option (SDK, CLI, MCP, region agent) and `FONOSTER_CA_FILE`; remove the CLI's
   `--insecure` and `MCP_ALLOW_INSECURE`.
4. Flip the default (Decision 3), upgrade rules (Decision 5), HSTS rule (Decision 4).
5. Dev container on `https://localhost`.
6. Docs and conformance.
Rollback: an owner sets `COMPOSE_FILE=compose.yaml:compose.http.yaml` and their old `PUBLIC_URL`.

## Open Questions

- ~~Library choice~~: none; Node's built-in crypto plus a minimal DER writer (Decision 2).
- Should `info` print the CA's SHA-256 fingerprint, so a remote client can check what it fetched?
