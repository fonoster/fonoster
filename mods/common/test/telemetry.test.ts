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
    const span = t.startCall("call-42", "gateway.call");
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
});
