# Fonoster with Docker Compose

Run Fonoster on one machine. You need Docker (with Compose) and Node.js 22.

```sh
npx -p @fonoster/common fonoster-config init
docker compose up -d
npx -p @fonoster/common fonoster-config info
```

1. `init` generates the secrets and keys, detects this machine's address and writes `.env` and
   `config/*.yaml`. Pass `--host-ip <address>` to set the address yourself. Running it again keeps
   every secret.
2. `docker compose up -d` starts the voice path, the API, the dashboard and the hosted Autopilot.
3. `info` prints the dashboard URL, the owner login and the SIP address.

Run `npx -p @fonoster/common fonoster-config check` to validate `config/` before starting.
Vendor keys (Deepgram, ElevenLabs, OpenAI, Groq...) are added per workspace in the dashboard.

Full guide: https://docs.fonoster.com/self-hosting/install-compose
