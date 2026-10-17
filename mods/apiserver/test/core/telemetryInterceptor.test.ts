/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { initTelemetry, Telemetry, telemetryEnv } from "@fonoster/common";
import { OtlpCollector } from "@fonoster/conformance";
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import { HealthImplementation } from "grpc-health-check";
import { createTelemetryInterceptor } from "../../src/core/telemetryInterceptor";

const TP = "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01";

async function serveHealth(t: Telemetry) {
  const server = new grpc.Server({
    interceptors: [createTelemetryInterceptor(t)]
  });
  new HealthImplementation({ "": "SERVING" }).addToServer(server);
  const port = await new Promise<number>((resolve, reject) =>
    server.bindAsync(
      "127.0.0.1:0",
      grpc.ServerCredentials.createInsecure(),
      (e, p) => (e ? reject(e) : resolve(p))
    )
  );
  return { server, port };
}

function checkHealth(port: number, md = new grpc.Metadata()) {
  const client = new grpc.Client(
    `127.0.0.1:${port}`,
    grpc.credentials.createInsecure()
  );
  return new Promise<void>((resolve, reject) =>
    client.makeUnaryRequest(
      "/grpc.health.v1.Health/Check",
      (b: Buffer) => b,
      (b: Buffer) => b,
      Buffer.alloc(0),
      md,
      (e) => {
        client.close();
        return e ? reject(e) : resolve();
      }
    )
  );
}

function fakeTelemetry() {
  const spans: { name: string; parent?: string; ended?: string | true }[] = [];
  const counts: { name: string; attrs?: Record<string, unknown> }[] = [];
  const t = {
    enabled: true,
    startSpan: (name: string, _a?: unknown, parent?: string) => {
      const s: (typeof spans)[number] = { name, parent };
      spans.push(s);
      return {
        traceparent: "",
        event: () => undefined,
        end: (_x?: unknown, error?: string) => (s.ended = error ?? true)
      };
    },
    count: (name: string, _v?: number, attrs?: Record<string, unknown>) =>
      counts.push({ name, attrs })
  } as unknown as Telemetry;
  return { t, spans, counts };
}

describe("@apiserver[core/telemetryInterceptor]", function () {
  it("records a span and a count per request, joining the caller's trace", async function () {
    const { t, spans, counts } = fakeTelemetry();
    const server = new grpc.Server({
      interceptors: [createTelemetryInterceptor(t)]
    });
    new HealthImplementation({ "": "SERVING" }).addToServer(server);
    const port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createInsecure(),
        (e, p) => (e ? reject(e) : resolve(p))
      )
    );
    const client = new grpc.Client(
      `127.0.0.1:${port}`,
      grpc.credentials.createInsecure()
    );
    const md = new grpc.Metadata();
    md.set("traceparent", TP);
    await new Promise<void>((resolve, reject) =>
      client.makeUnaryRequest(
        "/grpc.health.v1.Health/Check",
        (b: Buffer) => b,
        (b: Buffer) => b,
        Buffer.alloc(0),
        md,
        (e) => (e ? reject(e) : resolve())
      )
    );
    client.close();
    server.forceShutdown();
    expect(spans).to.deep.equal([
      { name: "apiserver.grpc", parent: TP, ended: true }
    ]);
    expect(counts[0]).to.deep.equal({
      name: "fonoster.apiserver.grpc.requests",
      attrs: {
        "rpc.method": "/grpc.health.v1.Health/Check",
        "rpc.grpc.status_code": "OK"
      }
    });
  });

  // Observability (harden-conformance 1.3): the apiserver's telemetry, built from the config's
  // `telemetry.otlpEndpoint` as apiserverTelemetry() does, reaches an OTLP collector.
  it("exports its request spans and counts over OTLP to the configured endpoint", async function () {
    const collector = await new OtlpCollector().start();
    const t = initTelemetry(
      "fonoster-apiserver",
      undefined,
      telemetryEnv({ otlpEndpoint: collector.endpoint }, {})
    );
    const { server, port } = await serveHealth(t);
    try {
      await checkHealth(port);
      await t.shutdown();
      const svc = "fonoster-apiserver";
      await collector.until(
        () =>
          collector.has(svc, "traces", "apiserver.grpc") &&
          collector.has(svc, "metrics", "fonoster.apiserver.grpc.requests"),
        "the apiserver's span and request count"
      );
    } finally {
      server.forceShutdown();
      await collector.stop();
    }
  });

  // Gaps against the observability spec (every service emits logs over OTLP; call signals carry
  // fonoster.call_ref): the apiserver logs only to standard output, and its call-path gRPC spans
  // (CreateCall, TrackCall) carry no call ref. Pending until the apiserver instruments its calls.
  it("exports log records over OTLP");
  it("tags the spans of a call's requests with fonoster.call_ref");

  it("is a pass-through when telemetry is disabled", function () {
    const call = {} as grpc.ServerInterceptingCall;
    const i = createTelemetryInterceptor({ enabled: false } as Telemetry);
    expect(i({ path: "/x" }, call)).to.equal(call);
  });
});
