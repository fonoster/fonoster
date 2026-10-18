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
import * as http from "http";
import { AddressInfo } from "net";

export type OtlpSignal = "traces" | "metrics" | "logs";

/** One OTLP/HTTP export request as received (JSON or protobuf body). */
export type OtlpExport = { signal: OtlpSignal; body: Buffer };

/**
 * A test collector for OTLP/HTTP (observability: "Signals reach the collector"). It accepts
 * `/v1/traces`, `/v1/metrics` and `/v1/logs` in either encoding: the Node services post JSON, the
 * Go Roomr node posts protobuf. Protobuf keeps attribute keys and string values as raw UTF-8, so
 * "does this export carry service.name X / fonoster.call_ref Y" is a byte search in both.
 */
export class OtlpCollector {
  readonly exports: OtlpExport[] = [];
  private server?: http.Server;
  private waiters: Array<() => void> = [];

  /** The base endpoint, as `telemetry.otlpEndpoint` or OTEL_EXPORTER_OTLP_ENDPOINT. */
  endpoint = "";

  async start(): Promise<this> {
    this.server = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (c: Buffer) => chunks.push(c));
      req.on("end", () => {
        const signal = /^\/v1\/(traces|metrics|logs)$/.exec(req.url ?? "")?.[1];
        if (signal) {
          this.exports.push({
            signal: signal as OtlpSignal,
            body: Buffer.concat(chunks)
          });
          this.waiters.splice(0).forEach((w) => w());
        }
        const json = /json/.test(req.headers["content-type"] ?? "");
        res.writeHead(signal ? 200 : 404, {
          "Content-Type": json ? "application/json" : "application/x-protobuf"
        });
        res.end(json ? "{}" : undefined);
      });
    });
    await new Promise<void>((r) => this.server!.listen(0, "127.0.0.1", r));
    const { port } = this.server.address() as AddressInfo;
    this.endpoint = `http://127.0.0.1:${port}`;
    return this;
  }

  async stop() {
    await new Promise<void>((r) =>
      this.server ? this.server.close(() => r()) : r()
    );
  }

  /** The exports of one signal from one service (by its service.name). */
  from(service: string, signal: OtlpSignal): Buffer[] {
    return this.exports
      .filter((e) => e.signal === signal && e.body.includes(service))
      .map((e) => e.body);
  }

  /** True when some export of `signal` from `service` contains every one of `needles`. */
  has(service: string, signal: OtlpSignal, ...needles: string[]) {
    return this.from(service, signal).some((b) =>
      needles.every((n) => b.includes(n))
    );
  }

  /** Resolves once `check` holds, re-evaluated on every export; rejects after `timeoutMs`. */
  async until(check: () => boolean, what: string, timeoutMs = 10000) {
    const deadline = Date.now() + timeoutMs;
    while (!check()) {
      const left = deadline - Date.now();
      if (left <= 0) throw new Error(`the collector never received ${what}`);
      await new Promise<void>((r) => {
        const timer = setTimeout(r, left);
        this.waiters.push(() => {
          clearTimeout(timer);
          r();
        });
      });
    }
  }
}
