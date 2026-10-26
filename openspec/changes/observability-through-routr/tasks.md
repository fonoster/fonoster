# Tasks

## 1. Fonoster

- [x] 1.1 `ops/bundle/compose.yaml`: pass `OTEL_EXPORTER_OTLP_ENDPOINT`, `_HEADERS`, `_PROTOCOL` to `routr`
- [x] 1.2 `send-telemetry.mdx`: a "See it in Grafana" recipe (`grafana/otel-lgtm`), Routr and Roomr rows corrected, search by `sip.call_id`
- [ ] 1.4 Bundle pins the Routr and Roomr releases that carry fonoster/routr#434 and fonoster/roomr#43 (before merge: the docs describe them)
- [x] 1.3 apiserver: the telemetry interceptor keeps the request metadata for the auth interceptor (with telemetry on, every request, the health check included, was refused)

## 2. fonoster/roomr

- [x] 2.1 OTLP logs (slog bridged to the OTel log exporter when an endpoint is set)
- [x] 2.2 `sip.call_id` on the call span
- [x] 2.3 The call span continues the INVITE's `traceparent` and passes its own in the session start

## 3. fonoster/routr

- [x] 3.1 `mods/common/src/tracer.ts`: metrics and logs as well as traces
- [x] 3.2 EdgePort: OTel SDK over OTLP/HTTP, configured by `OTEL_*`; off with no endpoint
- [x] 3.3 EdgePort: one span per SIP transaction (method, `sip.call_id`, transport, peer, status)
- [x] 3.4 EdgePort: `routr.sip.send_dropped` counter and log record where a message is dropped
- [x] 3.5 EdgePort: Log4j2 records over OTLP
- [x] 3.7 EdgePort: a request's `traceparent` makes its span a child; forwarded requests carry the span's `traceparent`
- [x] 3.6 Charts and compose: `OTEL_EXPORTER_JAEGER_ENDPOINT` replaced by `OTEL_EXPORTER_OTLP_*`

## 4. Proof

- [x] 4.1 Local stack + otel-lgtm: a browser call the app hangs up shows the dropped BYE in Grafana
  - 2026-10-25, rb-stack with local Routr and Roomr images: `SIP BYE` span in error after 32.2 s,
    `routr_sip_timeouts_total{sip_method="BYE"}` 1, `routr_sip_send_dropped_total{routr_drop_reason="ws_reconnect"}` 1;
    the dropped bytes were the TLS handshake of a new outbound connection to the browser's proxy-side port.
    A SIP call found by `sip.call_id` returned Routr's INVITE, ACK and BYE spans and Roomr's call span.
  - After 2.3 and 3.7: a SIP call to the demo agent was one trace (13374c5e…): SIP INVITE, roomr.call.inbound,
    appbridge.call, autopilot.session (llm.request, turn).
- [ ] 4.2 Production: otel-lgtm on fnai (localhost only), `OTEL_EXPORTER_OTLP_ENDPOINT` set (owner approves the switch)
