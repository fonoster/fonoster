# Configuration

Fonoster is three deployables, each configured on its own:

| Service | Reads | Notes |
|---|---|---|
| API server (with Identity) | `fonoster.yaml` | Everything, secrets included |
| Autopilot | `autopilot.yaml` | One file for every replica |
| Dashboard | `DASHBOARD_API_URL` | Everything else comes from the API server |

Third-party containers (Routr, Asterisk, RTPEngine, AMD, Postgres, InfluxDB,
NATS, Envoy) keep their environment variables in `.env`.

## Quick start

```bash
cp .env.example .env                                   # third-party containers
cp config/fonoster.example.yaml config/fonoster.yaml   # API server
cp config/autopilot.example.yaml config/autopilot.yaml # Autopilot
cp config/integrations.example.json config/integrations.json
chmod 600 config/fonoster.yaml config/autopilot.yaml config/integrations.json
docker compose up -d
```

## How the files work

- **Where they're found.** `--config <path>`, otherwise `/opt/fonoster/<name>.<ext>`,
  otherwise `./config/<name>.<ext>`.
- **YAML or JSON with comments.** `.yaml`/`.yml` or `.json`/`.jsonc`
  (`config/fonoster.example.jsonc` shows the JSONC form). Two files for the same
  service in one directory stop it at boot.
- **No environment variables.** The API server and Autopilot read only their file.
  Secrets are written in the file, so treat it as a secret: `chmod 600`, never
  committed, mounted from a Secret on Kubernetes.
- **`${VAR}` for shared values only.** Where `fonoster.yaml` needs a value a
  third-party container also reads from `.env` (the Postgres user and password,
  `INFLUXDB_INIT_*`, the ARI and SIP proxy credentials) it references the
  variable, so the value is written once. `${VAR}` anywhere else is an error.
  Compose passes `.env` to the API server (`env_file`) for this.
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
  verified email.
- **`signup: open`** lets people create their own account (password sign-up,
  or on first email-code/GitHub sign-in). With `invite`, only invited users and
  existing accounts can sign in.

Community ships with `[password]` and `invite`; Fonoster Cloud uses
`[github, email_code]` and `open`. Clients read the active settings from the
API server's public `Capabilities/GetCapabilities` RPC (`client.getCapabilities()`
in the SDK), which also reports billing, cost display, domain and app URL, and
never returns secrets. Identity enforces `features.auth` but doesn't report it.

Code sends are limited to 3 per email and 20 per client IP every 10 minutes.
The limits are kept in each process's memory, so with several replicas each
one enforces its own.

## Standalone Identity

Standalone Identity reads `identity.json` (or `.jsonc`/`.yaml`) with its fields at
the root, as before: `server`, `database`, `encryptionKey`, `issuer`, `audience`,
`appUrl`, `keys`, `tokens`, `security`, `invite`, `smtp` (with `auth.user`/`auth.pass`),
`oauth2` and `defaultUser`. New, optional: `logs`, `twilio` and `features.auth`.
The same settings sit under `identity:` in `fonoster.yaml`. Validation is strict
(unknown keys fail), and the defaults match the API server's.

## Upgrading from environment variables

Move each value from `.env` into the key below, then delete the variable.
Variables not listed here (`ROUTR_*`, `ASTERISK_*`, `RTPENGINE_*`, `AMD_*`,
`POSTGRES_*`, `INFLUXDB_INIT_*`) stay in `.env`.

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
| `APISERVER_ASTERISK_ARI_PROXY_URL` | `mediaService.asterisk.ariUrl` |
| `APISERVER_ASTERISK_ARI_USERNAME / _SECRET` | `mediaService.asterisk.ariUsername / ariPassword (reference ${ASTERISK_ARI_USERNAME}, ${ASTERISK_ARI_SECRET})` |
| `APISERVER_ASTERISK_SYSTEM_DOMAIN` | `mediaService.asterisk.systemDomain` |
| `APISERVER_AMD_ENABLED / _ENGINE / _MODE` | `amd.enabled / engine / mode` |
| `APISERVER_ROUTR_API_ENDPOINT` | `routr.apiEndpoint` |
| `APISERVER_ROUTR_DEFAULT_PEER_AOR / _NAME` | `routr.defaultPeer.aor / name` |
| `APISERVER_ROUTR_DEFAULT_PEER_USERNAME / _PASSWORD` | `routr.defaultPeer.username / password (reference ${ASTERISK_SIPPROXY_USERNAME}, ${ASTERISK_SIPPROXY_SECRET})` |
| `APISERVER_NATS_URL` | `nats.url` |
| `APISERVER_INFLUXDB_URL` | `influxdb.url` |
| `APISERVER_INFLUXDB_INIT_ORG / _USERNAME / _PASSWORD / _TOKEN` | `influxdb.org / username / password / token (reference ${INFLUXDB_INIT_*})` |
| `APISERVER_INTEGRATIONS_FILE` | `integrationsFile` |
| `APISERVER_TEMPLATES_DIR` | `templatesDir` |
| `APISERVER_TWILIO_PHONE_NUMBER / _ACCOUNT_SID / _AUTH_TOKEN` | `twilio.phoneNumber / accountSid / authToken` |
| `AIC_SDK_LICENSE` | `audioFilters.aiCoustics.license` |
| `APISERVER_IDENTITY_DATABASE_URL` | `identity.database.url (optional; defaults to database.url)` |
| `APISERVER_IDENTITY_ISSUER / _AUDIENCE` | `identity.issuer (defaults to appUrl) / identity.audience` |
| `APISERVER_IDENTITY_PRIVATE_KEY_PATH / _PUBLIC_KEY_PATH` | `identity.keys.privateKeyPath / publicKeyPath (or privateKey / publicKey inline)` |
| `APISERVER_IDENTITY_ACCESS_TOKEN_EXPIRES_IN / _ID_TOKEN_EXPIRES_IN / _REFRESH_TOKEN_EXPIRES_IN` | `identity.tokens.accessTokenExpiresIn / idTokenExpiresIn / refreshTokenExpiresIn` |
| `APISERVER_IDENTITY_CONTACT_VERIFICATION_REQUIRED / _TWO_FACTOR_AUTHENTICATION_REQUIRED` | `identity.security.contactVerificationRequired / twoFactorAuthenticationRequired` |
| `APISERVER_IDENTITY_WORKSPACE_INVITE_URL / _FAIL_URL / _EXPIRATION` | `identity.invites.url / failUrl / expiration (URLs default from appUrl)` |
| `APISERVER_IDENTITY_OAUTH2_GITHUB_ENABLED` | `github in features.auth.methods` |
| `APISERVER_IDENTITY_OAUTH2_GITHUB_CLIENT_ID / _CLIENT_SECRET` | `identity.oauth2.github.clientId / clientSecret` |
| `APISERVER_OWNER_NAME / _EMAIL / _PASSWORD` | `identity.owner.name / email / password` |

### Autopilot → `autopilot.yaml`

| Variable | Key |
|---|---|
| `AUTOPILOT_APISERVER_ENDPOINT` | `apiserver.endpoint` |
| `AUTOPILOT_LOGS_*` | `logs.*` |
| `AUTOPILOT_CONVERSATION_PROVIDER / _PROVIDER_FILE` | `conversation.provider / file` |
| `AUTOPILOT_INTEGRATIONS_FILE` | `integrationsFile` |
| `AUTOPILOT_KNOWLEDGE_BASE_ENABLED` | `knowledgeBase.enabled` |
| `AUTOPILOT_AWS_S3_ENDPOINT / _REGION / _ACCESS_KEY_ID / _SECRET_ACCESS_KEY` | `knowledgeBase.s3.endpoint / region / accessKeyId / secretAccessKey` |
| `AUTOPILOT_UNSTRUCTURED_API_URL / _API_KEY` | `knowledgeBase.unstructured.url / apiKey` |
| `AUTOPILOT_OPENAI_API_KEY` | `knowledgeBase.embeddings.openaiApiKey` |
| `AUTOPILOT_RECORDING_BASE_URL` | `recordings.baseUrl` |
| `AUTOPILOT_SKIP_IDENTITY` | `dev.skipIdentity` |
| `(new)` | `server.bindAddr, server.identityAddress (were fixed in code)` |

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
- **Verification codes are single use**, expire after 5 minutes, and stop
  working after 5 wrong guesses or when a newer code is sent.
- **The apiserver image** starts through `dist/bin/entrypoint.js`, which waits for
  Postgres, migrates, seeds and starts, reading the database URL from the file.
