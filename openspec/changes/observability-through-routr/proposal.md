# Proposal

## Why

A browser call to a stream app stayed "Connected" after the app hung up (2026-10-25, app.fonoster.ai
v0.32.0). AppBridge and Roomr did their part; Routr's EdgePort dropped the BYE to the WebRTC client
and said so only in a `warn` line. Finding it took SSH, three containers' logs and timestamp matching,
because the SIP edge emits no telemetry and the Roomr node sends no logs. The owner asked for
telemetry that lets an operator point Fonoster at a backend and see what is happening, Routr included.

The `observability` spec also promises an `observability` Compose profile and Helm values with
Grafana, Tempo, Loki and Prometheus. The profile was dropped from the bundle in 7bddf56bc
(2026-10-16). The owner decided the backend belongs in the documentation, not in the bundle.

## What Changes

- **Backend:** the docs give a run-it-yourself recipe (one `grafana/otel-lgtm` container) in place
  of a bundled profile. Bring your own OTLP backend stays the rule.
- **Routr joins every service:** EdgePort and the Routr Node services send traces, metrics and logs
  over OTLP with the standard `OTEL_*` settings. EdgePort reports one span per SIP transaction and
  counts every message it drops.
- **SIP correlation:** Routr and Roomr spans carry `sip.call_id`, and Roomr's call span carries both
  `sip.call_id` and `fonoster.call_ref`, so one search goes from a SIP dialog to the Fonoster call.
- **Roomr sends logs** over OTLP, like AppBridge.
- **Bundle:** Compose passes `OTEL_EXPORTER_OTLP_*` to the `routr` service.
- **apiserver fix:** with telemetry on, the telemetry interceptor hid the request metadata from the
  auth interceptor, so every request, the health check included, was refused. Found by the
  end-to-end run; production only escaped it because telemetry was off.

## Impact

- Capability: `observability` (three requirements modified).
- Fonoster: `ops/bundle/compose.yaml`, `docs-site/self-hosting/send-telemetry.mdx`,
  `mods/apiserver/src/core/telemetryInterceptor.ts`.
- fonoster/routr: `mods/common/src/tracer.ts`, `mods/edgeport` (OTel SDK, SIP spans, drop counter,
  Log4j2 OTLP appender), charts and compose (`OTEL_EXPORTER_JAEGER_ENDPOINT` removed).
- fonoster/roomr: OTLP logs, `sip.call_id` on the call span.
- Production: `grafana/otel-lgtm` on fnai, bound to localhost (owner decision).
