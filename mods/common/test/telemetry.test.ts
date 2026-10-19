import * as http from "http";
import { AddressInfo } from "net";
import { expect } from "chai";
import {
  CALL_REF_ATTR,
  initTelemetry,
  telemetryEnabled
} from "../src/telemetry";

describe("@fonoster/common telemetry", () => {
  it("is a no-op without an OTLP endpoint", async () => {
    expect(telemetryEnabled({})).to.equal(false);
    const t = initTelemetry("svc", "i", {});
    expect(t.enabled).to.equal(false);
    t.startCall("c1", "x").end();
    t.log("info", "hello");
    t.count("n");
    await t.shutdown();
  });

  it("sends traces, logs and metrics carrying fonoster.call_ref", async () => {
    const got: Record<string, any> = {};
    const server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        got[req.url!] = JSON.parse(body);
        res.end("{}");
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as AddressInfo).port;
    const t = initTelemetry("svc", "i1", {
      OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${port}`
    });
    expect(t.enabled).to.equal(true);
    const span = t.startCall("call-42", "appbridge.call");
    t.log("info", "call started", { callRef: "call-42" });
    t.count("calls", 2, { kind: "inbound" });
    t.gauge("active", () => 3);
    span.event("answered");
    span.end();
    await t.shutdown();
    server.close();
    const s = got["/v1/traces"].resourceSpans[0].scopeSpans[0].spans[0];
    expect(
      s.attributes.find((a: any) => a.key === CALL_REF_ATTR).value.stringValue
    ).to.equal("call-42");
    expect(s.traceId).to.have.length(32);
    const l = got["/v1/logs"].resourceLogs[0].scopeLogs[0].logRecords[0];
    expect(
      l.attributes.find((a: any) => a.key === CALL_REF_ATTR).value.stringValue
    ).to.equal("call-42");
    expect(l.traceId).to.equal(s.traceId);
    const names = got[
      "/v1/metrics"
    ].resourceMetrics[0].scopeMetrics[0].metrics.map((m: any) => m.name);
    expect(names).to.include.members(["calls", "active"]);
  });

  it("propagates a call's trace with a W3C traceparent (NATS headers, gRPC metadata)", async () => {
    const got: Record<string, any> = {};
    const server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        got[req.url!] = JSON.parse(body);
        res.end("{}");
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as AddressInfo).port;
    const t = initTelemetry("svc", "i2", {
      OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${port}`
    });
    const call = t.startCall("call-7", "appbridge.call");
    const parent = t.traceparent("call-7")!;
    expect(parent).to.match(/^00-[0-9a-f]{32}-[0-9a-f]{16}-0[01]$/);
    const child = t.startSpan(
      "media.command",
      { "fonoster.command": "play" },
      parent
    );
    expect(child.traceparent.split("-")[1]).to.equal(parent.split("-")[1]);
    child.end();
    call.end();
    expect(t.traceparent("call-7")).to.equal(undefined);
    await t.shutdown();
    server.close();
    const spans = got["/v1/traces"].resourceSpans[0].scopeSpans[0].spans;
    const c = spans.find((s: any) => s.name === "media.command");
    const p = spans.find((s: any) => s.name === "appbridge.call");
    expect(c.traceId).to.equal(p.traceId);
    expect(c.parentSpanId).to.equal(p.spanId);
  });

  it("returns no-op spans and no traceparent when disabled", () => {
    const t = initTelemetry("svc", "i", {});
    const s = t.startSpan(
      "x",
      {},
      "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
    );
    expect(s.traceparent).to.equal("");
    s.end();
    expect(t.traceparent("c")).to.equal(undefined);
  });
});
