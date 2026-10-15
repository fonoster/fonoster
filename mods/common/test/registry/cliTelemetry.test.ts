/*
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
import { expect } from "chai";
import { runTraced } from "../../src/registry/cli";

describe("@common/registry cli telemetry", function () {
  it("exports a registry.command span and a command count", async function () {
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
    const log = console.log;
    console.log = () => undefined;
    try {
      const code = await runTraced(["help"], {
        OTEL_EXPORTER_OTLP_ENDPOINT: `http://127.0.0.1:${port}`
      });
      expect(code).to.equal(0);
    } finally {
      console.log = log;
      server.close();
    }
    const metric = got[
      "/v1/metrics"
    ].resourceMetrics[0].scopeMetrics[0].metrics.find(
      (m: any) => m.name === "fonoster.registry.commands"
    );
    expect(metric.sum.dataPoints[0].asInt).to.equal("1");
    const spans = got["/v1/traces"].resourceSpans[0].scopeSpans[0].spans;
    expect(spans.map((s: any) => s.name)).to.include("registry.command");
  });
});
