# Docs checkpoint — self-hosting-call-record-keys

Started: 2026-10-19
Current stage: 7 — Wire (lead wires docs.json)

**Purpose:** An operator learns to rotate the key that signs call records without a restart,
publish the public keys so developers can verify records, and retire old private keys. It also
says how long records are kept and what the operator controls there.

**Diátaxis type:** how-to
**Reader:** self-hosters (Compose)

**Placement:** new `self-hosting/call-record-keys` · nav group `Operate` (Self-hosting tab)

**Sources:**
- `mods/callrecord/src/cli.ts`, `keys.ts`, `sign.ts`; `mods/callrecord/package.json` (bin)
- `mods/appbridge/src/record/keyCustody.ts`, `http/keySetRoute.ts`, `Gateway.ts`, `config.ts` (signingKey, keyHistory, jku, http)
- `mods/common/src/config/cli/secrets.ts` (records.pem, mode 0644)
- `ops/bundle/compose.yaml`, `ops/bundle/config/gateway.example.yaml`, `envoy.yaml`
- `mods/apiserver/src/config/schema.ts` (retentionIntervalMinutes), `docs/call-records.md`

| # | Stage | Status | Notes |
| :- | :--- | :--- | :--- |
| 0 | Frame | done | |
| 1 | Source | done | |
| 2 | Place | done | |
| 3 | Outline | done | |
| 4 | Assets | pending | `call-record-keys/rotation` queued |
| 5 | Draft | done | |
| 6 | Proof | done | curl 200 on :3334 |
| 7 | Wire | pending | lead |

## Unverified
- `npx -p @fonoster/callrecord fonoster-callrecord` assumes the package is published on npm at 0.30.
- Migrating `records.pem` into a key directory (copy + `openssl pkey -pubout` + `current`) was not run live.
- `chmod 644` so the gateway (uid 1001) reads keys made by `keys rotate` (0600, host user): reasoned from the code, not tested.
- "Recreating the gateway ends calls in progress" is inferred.

## Decision log
- 2026-10-19 — Compose ships a fixed key (`kid: local-1`) and no `jku`, and neither the gateway's `http` nor Envoy serves `/.well-known/call-record-keys.json`. The page moves to a key directory and tells operators to host `keys publish` output themselves.
- 2026-10-19 — Key directory lives in `config/record-keys`, not `config/keys`, because the apiserver mounts all of `config/keys`.
- 2026-10-19 — Analytics rebuild left to the ClickHouse page (linked in next steps).
