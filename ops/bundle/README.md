# Fonoster with Docker Compose

Run Fonoster on one machine. You need Docker (with Compose) and Node.js 22.

On Linux, set `{ "userland-proxy": false }` in `/etc/docker/daemon.json` and restart Docker first.
Otherwise Docker starts one `docker-proxy` per published media port (about 4,000) and the machine
runs out of memory.

```sh
npx -p @fonoster/common fonoster-config init
docker compose up -d
npx -p @fonoster/common fonoster-config info
```

1. `init` generates the secrets and keys, detects this machine's address and writes `.env` (with
   the secrets) and `config/*.yaml` (which reference them as `${NAME}`). Pass `--host-ip <address>` to set the address yourself. Running it again keeps
   every secret.
2. `docker compose up -d` starts the voice path, the API, the dashboard and the hosted Autopilot.
3. `info` prints the dashboard URL, the owner login and the SIP address.

Run `npx -p @fonoster/common fonoster-config check` to validate `config/` before starting.

The dashboard and API use plain HTTP on `HTTP_PORT` (8449) by default. On the internet, turn on
HTTPS: set `COMPOSE_FILE=compose.yaml:compose.tls.yaml`, `TLS_CERT`, `TLS_KEY` and
`PUBLIC_URL=https://<domain>` in `.env` (see `.env.example` and `compose.tls.yaml`), run `init`
again and `docker compose up -d`. Envoy then serves 443 with your certificate and redirects 80.
Or keep plain HTTP behind your own TLS proxy with `HTTP_BIND=127.0.0.1`.
Vendor keys (Deepgram, ElevenLabs, OpenAI, Groq...) are added per workspace in the dashboard.

Call records being written live in the `appbridge-records` volume (`callRecord.dir` in
`config/appbridge.yaml`, `/var/lib/fonoster/records`), so recreating AppBridge container (an
upgrade, a crash) does not lose the calls in flight. A `config/appbridge.yaml` from an older release
may still say `/tmp/fonoster-records`: change it to `/var/lib/fonoster/records`.

Full guide: https://docs.fonoster.com/self-hosting/install-compose
