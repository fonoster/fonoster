# Proposal

## Why

A fresh install serves the dashboard and API over plain HTTP until the owner sets up a certificate.
On a server that breaks the first experience: browsers block the microphone on
`http://<public IP>`, so Talk to agent can't work, and passwords and API keys cross the network in
clear text. Developers run plain HTTP too, so nothing exercised the HTTPS path before production:
the WSS bug fixed in #1134 shipped that way. Serving HTTPS from the first start, with a generated
certificate, makes every install work out of the box and keeps development on the same path as
production. It is for getting started only: self-hosters and developers switch to a real
certificate before going live.

## What Changes

- `fonoster-config init` generates a local certificate authority and a server certificate signed by
  it when the owner hasn't set `TLS_CERT` and `TLS_KEY`. The server certificate covers
  `localhost`, `127.0.0.1`, the host address and the `PUBLIC_URL` host, and is reissued when those
  names change. The CA stays the same across runs. Both live in `config/tls/`, readable by the owner
  only (the private keys), never committed and never in the release archive.
- **BREAKING**: HTTPS is on by default. Envoy serves HTTPS on 443 and redirects 80, plain HTTP on
  `HTTP_PORT` is no longer published, and `PUBLIC_URL` defaults to `https://`. An install that wants
  plain HTTP (behind its own TLS proxy) opts out explicitly.
- Owner-provided `TLS_CERT` and `TLS_KEY` (Let's Encrypt or another CA) replace the generated
  certificate; `init` then generates nothing.
- `init`, `check` and `info` say when the generated certificate is in use, that it is for getting
  started, and where `ca.pem` is.
- API clients trust the generated CA explicitly: the SDK takes a CA file, the `fonoster` CLI and the
  `fonoster-region` agent take `--ca-file`, and all of them read one environment variable.
- **BREAKING**: user-facing tools always use TLS. The CLI's `--insecure` and the MCP server's
  `MCP_ALLOW_INSECURE` are removed. The SDK's `allowInsecure` and the region agent's
  `--allow-insecure` stay, documented for private-network use only (service to service, in-process
  tests, a region agent inside the cluster). Webhook delivery to `http://` URLs and the dev stack's
  NATS leaf are unrelated and unchanged.
- Services that call the install's own public `https://` address get the CA.
- The dev container runs the same way, on `https://localhost`.
- The docs (install guide, HTTPS page) say the generated certificate is for getting started, show
  the one-time browser warning, how to fetch `ca.pem` for clients, and how to switch to a real
  certificate before going live.

## Capabilities

### New Capabilities
- `api-client-trust`: how the SDK, the `fonoster` CLI, the MCP server and the region agent trust a
  server's certificate authority (CA file option, environment variable), and where plain connections
  are still allowed (private networks only).

### Modified Capabilities
- `self-host-installer`: `init` generates the local CA and server certificate, HTTPS is the default
  start, `info` and `check` report the certificate in use.
- `talk-in-browser`: SIP over WebSocket is served over HTTPS by default (`wss://`), plain `ws://` only
  when HTTPS is turned off.
- `developer-environment`: the dev config includes the generated CA and certificate and the dev
  stack serves `https://localhost`.

## Impact

- `mods/common/src/config/cli` (init, check, info, exposure warnings) and a certificate library
  (`init` must not need `openssl`).
- `ops/bundle`: `compose.yaml`, `compose.tls.yaml`, `.env.example`, `config/envoy*.yaml`,
  `config/fonoster.example.yaml`.
- `ops/rebuild`: the dev stack and `stack tls on|off`, the dev container's config generation.
- `mods/sdk/src/client/Client.ts`, `mods/ctl` (login and authenticated commands),
  `mods/region-agent/src/cli.ts`, `mods/mcp`.
- Conformance: bundle tests (HTTPS default), dashboard e2e (already runs over HTTPS for DSH-063),
  SDK/CLI tests for the CA option.
- Docs: `docs-site/self-hosting/install-compose.mdx`, `docs-site/self-hosting/https.mdx`, the
  dev-container page, SDK and CLI references.
- Existing installs: an upgrade keeps their current `PUBLIC_URL` and certificate settings; the new
  default applies to new installs and to installs whose `.env` has neither.
