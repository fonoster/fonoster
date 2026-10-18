# Configuration

Each Fonoster service reads one file, mounted at `/config/<name>.yaml` in its container:

| Service | Reads | Notes |
|---|---|---|
| API server (with Identity) | `fonoster.yaml` | Everything; secrets as `${NAME}` placeholders |
| Voice gateway | `gateway.yaml` | `encryption.key` is the API server's key |
| Autopilot | `autopilot.yaml` | One file for every replica |
| Media node | `roomr.yaml` | Flags win over it; `ROOMR_*` variables are not read |
| Dashboard | `DASHBOARD_API_URL` | Everything else comes from the API server |

The Compose stack is `ops/bundle/compose.yaml` (with the development layer
`ops/rebuild/compose.yaml`; the root `compose.yaml` includes both; docs/operators/rebuild.md), and `ops/rebuild/stack up` renders every file
below for one machine (docs/try-the-new-platform.md). In the dev container
(CONTRIBUTING.md) the same files live in the git-ignored `.dev/config/`, written
by `fonoster-config init` with the dev layer in `.devcontainer/config/`.

The dashboard is a static app behind nginx. At start-up it writes `/config.js`
and its Content-Security-Policy from `DASHBOARD_API_URL` (the API's public URL as
the browser reaches it, i.e. Envoy); sign-in methods, sign-up, billing and cost
display come from `features.*` through `GetCapabilities`. Nothing is baked into
the image, so one image serves Community and Cloud.

## Quick start

```bash
npx -p @fonoster/common fonoster-config init   # in the bundle folder: .env (secrets), config/*.yaml, keys
npx -p @fonoster/common fonoster-config check  # validate before starting
docker compose up -d
```

Developing Fonoster: open the repository in its dev container, which does the
same into `.dev/`, then `npm run dev` (CONTRIBUTING.md).

**HTTPS (Compose).** Envoy serves plain HTTP on `HTTP_PORT` by default. Setting
`COMPOSE_FILE=compose.yaml:compose.tls.yaml`, `TLS_CERT` and `TLS_KEY` (PEM files on
the host, mounted read-only) and `PUBLIC_URL=https://<domain>` in `.env` switches it
to `config/envoy-tls.yaml`: HTTPS on 443, a redirect on 80, and 8449 unpublished.
`HTTP_BIND=127.0.0.1` instead keeps plain HTTP on the host for a TLS proxy in front.
Browser calls follow `appUrl` (`ws://` or `wss://…/sip`). `init` and `check` warn
when `PUBLIC_URL` is `http://` on a non-private address or the HTTPS setup is
incomplete. SIP over TLS (Routr on 5061) is documented, commented out, in
`compose.tls.yaml` and `routr-edgeport.example.yaml`
(docs-site/self-hosting/install-compose.mdx).

## How the files work

- **Where they're found.** `--config <path>`, otherwise `/config/<name>.<ext>`, then
  `/opt/fonoster/<name>.<ext>` (`/etc/fonoster` for the gateway and Autopilot), then
  `./config/<name>.<ext>`.
- **YAML or JSON with comments.** `.yaml`/`.yml` or `.json`/`.jsonc`
  (`config/fonoster.example.jsonc` shows the JSONC form). Two files for the same
  service in one directory stop it at boot.
- **No environment variables of their own.** Services read only their file. A value
  may be a `${VAR}` or `${VAR:-default}` placeholder at any key; it is resolved from
  the container's environment, which Compose fills from `.env`: each service's
  `environment:` list passes only the names its own file uses, never the whole `.env`
  (a placeholder you add needs a line there too). Secrets stay in `.env` this way; a
  service never reads `.env` itself. An unset variable
  without a default stops the service, naming the variable and the key. Inline
  secrets and `secret://` references still work (treat such a file as a secret).
- **Telemetry.** `telemetry: { otlpEndpoint: "${OTEL_EXPORTER_OTLP_ENDPOINT:-}" }`
  in each file; empty is off.
- **Strict.** An unknown or misspelled key stops the service at boot and names it
  (`smtp: unknown key "hsot"`). Keys that moved say where they went. Old
  `APISERVER_*`/`AUTOPILOT_*` variables still in the environment are ignored,
  with one warning listing their names.
- **Features, not editions.** `features` in `fonoster.yaml` (sign-in methods,
  sign-up, billing, cost display, call data) is what the code checks. The example
  carries Community values; Cloud keeps its own file.
- **Editor autocomplete.** The examples point at a JSON Schema (`$schema` in JSONC,
  a `yaml-language-server` comment in YAML).

## Sign-in methods (`features.auth`)

```yaml
features:
  auth:
    methods: [password]        # any of: password, email_code, github
    signup: invite             # invite | open
```

- **`password`**: email and password. Passwords are stored as salted scrypt
  digests; invitees get a one-time password and must set their own after
  signing in.
- **`email_code`**: passwordless. `SendVerificationCode` emails a 6-digit code
  (5 minutes, single use, 5 wrong guesses at most) that
  `ExchangeVerificationCode` trades for tokens. Needs `smtp`.
- **`github`**: needs `identity.oauth2.github`. Uses the account's primary
  verified email. Register `<appUrl>/oauth/github/callback` as the OAuth app's
  callback URL. For local and end-to-end testing without a real OAuth app, run
  the fake GitHub (`node .scripts/fake-github.mjs` in the dev container) and point
  `identity.oauth2.github.url` and `apiUrl` at `http://localhost:3999`.
- **`signup: open`** lets people create their own account (password sign-up,
  or on first email-code/GitHub sign-in). With `invite`, only invited users and
  existing accounts can sign in.

Community ships with `[password]` and `invite`; Fonoster Cloud uses
`[github, email_code]` and `open`. Clients read the active settings from the
API server's public `Capabilities/GetCapabilities` RPC (`client.getCapabilities()`
in the SDK), which also reports billing, cost display, domain and app URL, and
never returns secrets. `regions.private` is true only when `regions.signingKey`
and `regions.hub` are both set (the private-regions hub was added); without
them the dashboard hides every region screen and the regions HTTP API
(`/api/regions*`, `/api/admin/regions*`, `/.well-known/region-keys.json`) is
not mounted. Identity enforces `features.auth` but doesn't report it.

Standalone Identity takes the same block at the root of `identity.json`, without
the `features` wrapper:

```json
"auth": { "methods": ["password"], "signup": "invite" }
```

Code sends are limited to 3 per email and 20 per client IP every 10 minutes.
The limits are kept in each process's memory, so with several replicas each
one enforces its own.

## Standalone Identity

Standalone Identity reads `identity.json` (or `.jsonc`/`.yaml`) with its fields at
the root, as before: `server`, `database`, `encryptionKey`, `issuer`, `audience`,
`appUrl`, `keys`, `tokens`, `security`, `invite`, `smtp` (with `auth.user`/`auth.pass`),
`oauth2` and `defaultUser`. New, optional: `logs`, `twilio` and `auth` (the same
block as `features.auth` in `fonoster.yaml`).
The same settings sit under `identity:` in `fonoster.yaml`. Validation is strict
(unknown keys fail), and the defaults match the API server's.

## Upgrading from environment variables

Move each value from `.env` into the key below, then delete the variable.
Variables not listed here (`ROUTR_*`, `RTPENGINE_*`, `POSTGRES_*`,
`INFLUXDB_INIT_*`) stay in `.env`. `ASTERISK_*` and `AMD_*` are gone with Asterisk.

### API server → `fonoster.yaml`

| Variable | Key |
|---|---|
| `APISERVER_ROOT_DOMAIN` | `domain` |
| `APISERVER_APP_URL` | `appUrl (defaults to https://<domain>)` |
| `APISERVER_SIGNALING_SERVER` | `signalingServer (defaults to wss://<domain>:5062)` |
| `APISERVER_BIND_ADDR / APISERVER_HTTP_BRIDGE_PORT / APISERVER_HOST` | `server.bindAddr / server.httpBridgePort / server.host` |
| `APISERVER_LOGS_LEVEL / _FORMAT / _TRANSPORT, LOGS_DRIVER_* , LOGS_OPT_TAG_PREFIX` | `logs.level / format / transport / fluent.*` |
| `APISERVER_DATABASE_URL` | `database.url (references ${POSTGRES_USER} and ${POSTGRES_PASSWORD})` |
| `APISERVER_CLOAK_ENCRYPTION_KEY` | `encryption.key` |
| `APISERVER_SMTP_HOST / _PORT / _SECURE / _SENDER` | `smtp.host / port / secure / sender` |
| `APISERVER_SMTP_AUTH_USER / _AUTH_PASS` | `smtp.user / smtp.password` |
| `APISERVER_AUTHZ_SERVICE_ENABLED / _HOST / _PORT / _METHODS` | `authz.enabled / host / port / methods (a list)` |
| `APISERVER_ROUTR_API_ENDPOINT` | `routr.apiEndpoint` |
| (new) | `routr.mediaNodePeer.aor / name / username / password` (the peer every app-linked number points at; created only with a password, reference `${ROOMR_PASSWORD}`) |
| `APISERVER_ASTERISK_*`, `APISERVER_AMD_*`, `APISERVER_ROUTR_DEFAULT_PEER_*`, `AIC_SDK_LICENSE` | Removed with Asterisk (`mediaService`, `amd`, `routr.defaultPeer`, `routr.engines` and `audioFilters` are unknown keys now) |
| `APISERVER_NATS_URL` | `nats.url` |
| `APISERVER_INFLUXDB_URL` | `influxdb.url` |
| `APISERVER_INFLUXDB_INIT_ORG / _USERNAME / _PASSWORD / _TOKEN` | `influxdb.org / username / password / token (reference ${INFLUXDB_INIT_*})` |
| `APISERVER_INTEGRATIONS_FILE` | Removed: vendor keys are operator config by credentialRef (`evaluations.credentials`, the gateway's and Autopilot's `credentials`); `fonoster-migrate-legacy --integrations` converts the old file |
| `APISERVER_TEMPLATES_DIR` | `templatesDir` |
| `APISERVER_TWILIO_PHONE_NUMBER / _ACCOUNT_SID / _AUTH_TOKEN` | `twilio.phoneNumber / accountSid / authToken` |
| `APISERVER_IDENTITY_DATABASE_URL` | `identity.database.url (optional; defaults to database.url)` |
| `APISERVER_IDENTITY_ISSUER / _AUDIENCE` | `identity.issuer (defaults to appUrl) / identity.audience` |
| `APISERVER_IDENTITY_PRIVATE_KEY_PATH / _PUBLIC_KEY_PATH` | `identity.keys.privateKeyPath / publicKeyPath (or privateKey / publicKey inline)` |
| `APISERVER_IDENTITY_ACCESS_TOKEN_EXPIRES_IN / _ID_TOKEN_EXPIRES_IN / _REFRESH_TOKEN_EXPIRES_IN` | `identity.tokens.accessTokenExpiresIn / idTokenExpiresIn / refreshTokenExpiresIn` |
| `APISERVER_IDENTITY_CONTACT_VERIFICATION_REQUIRED / _TWO_FACTOR_AUTHENTICATION_REQUIRED` | `identity.security.contactVerificationRequired / twoFactorAuthenticationRequired` |
| `APISERVER_IDENTITY_WORKSPACE_INVITE_URL / _FAIL_URL / _EXPIRATION` | `identity.invites.url / failUrl / expiration (URLs default from appUrl)` |
| `APISERVER_IDENTITY_OAUTH2_GITHUB_ENABLED` | `github in features.auth.methods` |
| `APISERVER_IDENTITY_OAUTH2_GITHUB_CLIENT_ID / _CLIENT_SECRET` | `identity.oauth2.github.clientId / clientSecret` |
| `APISERVER_OWNER_NAME / _EMAIL / _PASSWORD` | `identity.owner.name / email / password` |

### Autopilot → `autopilot-session.yaml`

The previous Autopilot engine and its `autopilot.yaml` are gone. The hosted engine reads
`autopilot-session.yaml` (see `config/autopilot-session.example.yaml` and
[docs/autopilot.md](./autopilot.md)); none of the `AUTOPILOT_*` variables carry over.
Autopilot no longer falls back to `APISERVER_DATABASE_URL` and `database.urlEnv` is gone: write
`database: { url: "${APISERVER_DATABASE_URL}" }`.

### Media node → `roomr.yaml`

The media node reads no `ROOMR_*` variables. Each one is a key (see
`ops/bundle/config/roomr.example.yaml`); reference the variable as `${NAME}` to keep the value
in the environment.

| Variable | Key |
|---|---|
| `ROOMR_ID` | `nodeId` |
| `ROOMR_NATS_URL / _NATS_USER / _NATS_PASSWORD` | `nats.url / user / password` |
| `ROOMR_SIP_LISTEN / _SIP_ADVERTISE` | `sip.listen / advertise` |
| `ROOMR_RTP_HOST / _RTP_ADVERTISE / _RTP_PORT_MIN / _RTP_PORT_MAX` | `rtp.host / advertise / portMin / portMax` |
| `ROOMR_REGISTRAR / _DOMAIN / _USERNAME / _PASSWORD / _TRANSPORT / _REGISTER_EVERY` | `sip.registrations[]`: `registrar` (`;transport=` for tcp/tls), `aor` (`sip:<username>@<domain>`), `auth.username / auth.password`, `expires` (twice the old interval), `headers: { X-Session-Count: "{sessions}" }` (the old `registration` block and flags are removed) |
| `ROOMR_OUTBOUND_PROXY / _OUTBOUND_TRANSPORT` | `outboundProxy / outboundTransport` |
| `ROOMR_TLS_LISTEN / _TLS_CERT / _TLS_KEY / _TLS_CA / _TLS_CLIENT_CA` | `tls.listen / cert / key / ca / clientCa` |
| `ROOMR_DEBUG_ADDR / _DRAIN_WAIT / _MAX_DURATION / _MAX_PARTICIPANTS / _MEDIA_TIMEOUT` | `debugAddr / drainWait / maxDuration / maxParticipants / mediaTimeout` |
| `ROOMR_SESSION_REGISTRY / _REQUIRE_ENCRYPTION / _TRUSTED_SOURCES` | `sessionRegistry / requireEncryption / trustedSources (a list)` |

### Easy to get wrong

- **Take a database snapshot first.** The first start turns stored passwords into
  one-way digests. After that, 0.27 can't sign password users in, so going back
  means restoring the `fnidentity` snapshot, not just the old image.
- **Copy `encryption.key` exactly.** It decrypts stored secrets and the old
  passwords during that first start. A wrong key stops the API server at boot.
- **Keep the same identity keys** (`identity.keys.*`) so existing tokens and API
  keys stay valid, and pin `identity.issuer` to its old value if anything outside
  Fonoster verifies tokens (it now defaults to `appUrl`).
- **Set `identity.database.url`.** It defaults to `database.url`, not to the
  `fnidentity` database the old `.env` pointed at.
- **Set `smtp.secure` explicitly.** It defaults to `false`; the old `.env.example`
  had `true`.
- **`none` is no longer a log format or transport.** Use `format: json|pretty`
  and `transport: console|fluent`. The old `.env.example` values stop boot.
- **Don't copy the old invite URLs.** Leave `identity.invites.url` and `failUrl`
  unset so they follow `appUrl` (`<appUrl>/invites`), and make `appUrl` the
  dashboard's public URL.
- **The owner password needs 8+ characters** (`identity.owner.password`).
- **The dashboard needs `DASHBOARD_API_URL`** at run time (the API's public URL,
  as the browser reaches it). Its old build arguments are gone. Users sign in
  again after the upgrade.
- **Envoy's rate limits are per Envoy, not per user.** `config/envoy.yaml` allows
  20 `SendVerificationCode` calls and 600 API calls a minute in total; the API
  server also limits codes per email and per IP. Raise them to fit your traffic,
  especially with email-code sign-in.

### Behaviour changes worth knowing

- **SMTP is optional.** Without an `smtp` section the API server starts; anything
  that sends email fails with "smtp is not configured".
- **Standalone Identity** keeps its file shape, but validation is now strict (unknown
  keys fail) and the defaults match the API server: refresh tokens last 24h (was 30d),
  invites 1d (was 2d), invite URLs default to `<appUrl>/invites`, and a default user
  needs an 8-character password. Set them explicitly to keep the old values.
- **Passwords become one-way digests.** On first start, existing passwords are
  re-stored as scrypt digests and the reversible copies are cleared. Take a
  database snapshot before upgrading. Self-service sign-up (`CreateUser`) now
  requires `features.auth.signup: open`.
- **Dashboard sessions use a cookie.** The dashboard no longer keeps tokens in
  `localStorage`: the refresh token lives in an httpOnly, `SameSite=Strict`
  cookie the API server sets on `/api/session` (served through Envoy's existing
  `/api` route, on the dashboard's origin; no CORS change). The cookie is
  `Secure` when `appUrl` is https, so a plain-http deployment still works but
  should move to TLS. Serve the dashboard and the API from the same origin, or
  dashboard sessions end on every reload. A session an older dashboard stored
  is moved into the cookie on first load; if that fails, users sign in once more.
- **Verification codes are single use**, expire after 5 minutes, and stop
  working after 5 wrong guesses or when a newer code is sent.
- **The apiserver image** starts through `dist/bin/entrypoint.js`, which waits for
  Postgres, migrates, seeds and starts, reading the database URL from the file.
