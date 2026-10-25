## ADDED Requirements

### Requirement: init generates a certificate for getting started

When `.env` sets neither `TLS_CERT` nor `TLS_KEY`, `init` SHALL generate, in `config/tls/`, a local
certificate authority (`ca.pem`, `ca-key.pem`) and a server certificate signed by it (`server.pem`,
`server-key.pem`) covering `localhost`, `127.0.0.1`, `HOST_IP` and the host of `PUBLIC_URL`. The
private keys MUST be readable by the owner only. Generating them MUST NOT need `openssl` or any tool
except Node 22.

#### Scenario: Fresh install
- **WHEN** `init` runs in a freshly unpacked bundle
- **THEN** `config/tls/` holds the CA and a server certificate whose names include `localhost`,
  `127.0.0.1` and the detected host address, and the private keys are mode 0600

#### Scenario: Not in the archive
- **WHEN** the release archive is built
- **THEN** it contains no `config/tls/` files

### Requirement: init keeps the generated CA

Running `init` again SHALL keep the generated CA byte for byte, and SHALL reissue the server
certificate only when one of its names changed or it expires within 30 days.

#### Scenario: Re-run keeps the CA
- **WHEN** `init` runs again with the same names
- **THEN** every file in `config/tls/` is byte-for-byte unchanged

#### Scenario: New host name
- **WHEN** the owner changes `PUBLIC_URL` to `https://voice.example.com` and runs `init` again
- **THEN** the server certificate is reissued with `voice.example.com` added, and `ca.pem` is
  unchanged

### Requirement: The owner's certificate replaces the generated one

When `.env` sets `TLS_CERT` and `TLS_KEY`, `init` SHALL configure Envoy with those files and
generate nothing.

#### Scenario: Owner's certificate
- **WHEN** `.env` sets `TLS_CERT` and `TLS_KEY` to existing files
- **THEN** `init` creates nothing in `config/tls/` and Envoy is configured with the owner's files

## MODIFIED Requirements

### Requirement: Start with plain Compose

After `init`, `docker compose up -d` in the bundle folder SHALL start the core voice path (NATS,
Postgres, Routr, RTPEngine, Roomr node, appbridge, MinIO), the apiserver with Identity, Envoy, the
dashboard and the hosted Autopilot, with no build step. Envoy SHALL serve the dashboard and API over
HTTPS on 443 with the generated or the owner's certificate, and redirect 80 to it; plain HTTP on
`HTTP_PORT` MUST be published only when the owner turns HTTPS off. The bundle MUST have no opt-in
Compose profiles: hosting private regions is a manual addition (`fonoster-region-hub-setup` in the
apiserver image), and telemetry and call metrics go to the owner's own collector and ClickHouse
through config keys.

#### Scenario: Default start
- **WHEN** the owner runs `docker compose up -d` after `init`
- **THEN** the dashboard answers on `https://<host>` (443), `http://<host>` redirects to it, and
  the owner can sign in with the login `info` prints

#### Scenario: HTTPS turned off
- **WHEN** the owner turns HTTPS off in `.env` (to put their own TLS proxy in front) and runs
  `init` and `docker compose up -d`
- **THEN** the dashboard answers on plain HTTP on `HTTP_PORT` and nothing listens on 443

#### Scenario: Telemetry to an existing collector
- **WHEN** the owner sets `OTEL_EXPORTER_OTLP_ENDPOINT` in `.env` and recreates the containers
- **THEN** every Fonoster service exports OTLP to that endpoint

### Requirement: info shows how to reach the install

`fonoster-config info` SHALL print the dashboard URL, the owner email and password, the SIP
address and port, and the paths of `.env`, `config/` and the keys. When the generated certificate
is in use, it SHALL also print the path of `ca.pem`, say that browsers show a warning once and API
clients need `--ca-file`, and say to use a real certificate before going live. It MUST read only
local files.

#### Scenario: After init
- **WHEN** the owner runs `fonoster-config info` in the bundle folder after `init`
- **THEN** the dashboard URL (`https://`), owner login and SIP address are printed

#### Scenario: Generated certificate in use
- **WHEN** `info` runs on an install that uses the generated certificate
- **THEN** it prints the `ca.pem` path and the getting-started notice

#### Scenario: Owner's certificate in use
- **WHEN** `info` runs on an install with `TLS_CERT` and `TLS_KEY` set
- **THEN** it prints no getting-started notice

#### Scenario: Before init
- **WHEN** `info` runs in a folder where `init` has not run
- **THEN** it exits non-zero and says to run `init` first
