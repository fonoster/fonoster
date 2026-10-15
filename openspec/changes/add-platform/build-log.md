# add-platform build log

## 2026-10-15 (spec review rulings, with the owner)

A separate reviewer read every rebuild spec; the owner ruled on each finding one by one.

### PL-R1. Cells: metadata out, content stays

- Only the call-record index (call ref, app, time, duration, status, cost, size, location), config
  and health cross the leaf link; the dashboard reads content from the cell with a short-lived
  link. Private cells answer `GetCapabilities` locally. SIP traces removed from the cell contents.

### PL-R2. PL3 revised for new calls

- `call.incoming` and `gateway.outbound` use request and reply on a gateway queue group (claim in
  500 ms, one retry, then 503) instead of JetStream.

## 2026-10-15 (platform stream build)

### PL-B1. Images and build contexts

- Gateway and Autopilot session engine build from the repo root (`npm install --workspace`, only that package's workspace closure, then `tsc -b` per package, `npm prune --omit=dev`). `npm install`, not `npm ci`: the lockfile does not yet list the OTel packages now declared in `mods/common`.
- Media node builds from `go/medianode` (golang:1.25 to `distroless/static:nonroot`, static, trimmed). Images run as non-root.
- The Autopilot session engine had no entry; added `mods/autopilot/src/session/main.ts`: reads one YAML (`AUTOPILOT_SESSION_CONFIG`), serves one assistant over the session `VoiceServer`. Dockerfile is `mods/autopilot/Dockerfile.session` (the legacy `Dockerfile` is untouched).

### PL-B2. The node had no RTP range

- The node bound ephemeral UDP ports, so no firewall/Service range was possible. Added `-rtp-port-min/-max` (`MEDIANODE_RTP_PORT_MIN/MAX`); allocation is round-robin inside the range and fails when exhausted. Also exposed limits as flags/env (max duration, participants, media timeout, `MEDIANODE_DRAIN_WAIT`).
- SRTP/TLS is not in the node yet, so the "encryption switch" is documented as not shipped.

### PL-B3. TypeScript telemetry without exporter packages

- node_modules has `@opentelemetry/api`, `sdk-trace-base`, `sdk-trace-node`, `resources` but no OTLP exporter or metrics/logs SDK. `mods/common/src/telemetry.ts` therefore uses the trace SDK plus a small OTLP/HTTP JSON sender for traces, logs and metrics (counter, gauge). Those four packages are declared in `mods/common/package.json`; the lockfile needs a refresh on the next install.
- Enabled only by `OTEL_EXPORTER_OTLP_*` endpoints; otherwise nothing is loaded and every call is a no-op. Protocol is HTTP/JSON only (collector port 4318); gRPC is not offered.

### PL-B4. Go telemetry

- `go/medianode/internal/telemetry` uses the official SDK over OTLP/HTTP. Pinned to otel v1.38.0 (log v0.14.0): v1.47 needs Go 1.26. Logs go through `otelslog` and are teed with the JSON stderr handler.

### PL-B5. Correlation by call ref

- Gateway `Call` starts a `gateway.call` span and logs start/end with `fonoster.call_ref`; the node spans `medianode.call.incoming` and counts claim outcomes with the same attribute. Trace context is not yet carried across NATS, so one call has a span per service joined by `fonoster.call_ref`, not one parent trace. Propagating `traceparent` in media-control messages is left open.

### PL-B6. Compose and Helm shape

- `ops/rebuild/compose.yaml` is separate from the legacy root `compose.yaml` (which still carries Asterisk and InfluxDB). Observability is a Compose profile; services get `OTEL_EXPORTER_OTLP_ENDPOINT` from the environment, empty by default.
- The chart runs the media node as a StatefulSet on the host network (RTP range); node id is the pod name; drain grace seconds feed both `-drain-wait` and `terminationGracePeriodSeconds`. Gateway is a Deployment with a PDB. NATS, Routr and the rest are expected from their own charts.
