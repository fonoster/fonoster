# Configuration

Each Fonoster service reads one file, mounted at `/config/<name>.yaml` in its container:

| Service | Reads | Notes |
|---|---|---|
| API server (with Identity) | `fonoster.yaml` | Everything; secrets as `${NAME}` placeholders |
| Voice gateway | `gateway.yaml` | `encryption.key` is the API server's key |
| Autopilot | `autopilot.yaml` | One file for every replica |
| Roomr node | `roomr.yaml` | Flags win over it; `ROOMR_*` variables are not read |
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

