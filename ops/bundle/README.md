# Fonoster with Docker Compose

Run Fonoster on one machine. You need Docker (with Compose) and `openssl`.

On Linux, set `{ "userland-proxy": false }` in `/etc/docker/daemon.json` and restart Docker first.
Otherwise Docker starts one `docker-proxy` per published media port (about 4,000) and the machine
runs out of memory.

```sh
./init.sh
docker compose up -d
```

1. `./init.sh` writes `.env` with generated secrets, the signing keys in `config/keys`, a
   certificate for getting started in `config/tls`, and the SIP port in
   `config/routr-edgeport.yaml`, then prints the dashboard URL, the owner email and where the
   password is. Pass `--host-ip <address>` to set the machine's address yourself. Running it
   again keeps every secret and prints the summary again.
2. `docker compose up -d` starts the voice path, the API, the dashboard and the hosted Autopilot.

The dashboard and API use HTTPS on 443 with the generated certificate: browsers warn once, and API
clients trust `config/tls/ca.pem`. Before going live, set `TLS_CERT`, `TLS_KEY` and
`PUBLIC_URL=https://<domain>` in `.env` and run `docker compose up -d`. Or serve plain HTTP behind
your own TLS proxy (`compose.http.yaml`).

Vendor keys (Deepgram, ElevenLabs, OpenAI, Groq...) are added per workspace in the dashboard.
Every other setting is in `config/<service>.yaml`, one file per service: edit it, then
`docker compose up -d --force-recreate <service>`. A bad file stops the service at start, and
`docker compose logs <service>` names the key.

Upgrade: unpack the new release next to this folder, copy `.env`, `config/keys` and `config/tls`
into it, apply your edits to its `config/` files, then `./init.sh` and `docker compose up -d`.
Full steps: https://docs.fonoster.com/self-hosting/upgrade

Full guide: https://docs.fonoster.com/self-hosting/install-compose
