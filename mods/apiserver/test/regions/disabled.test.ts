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
import { Server } from "http";
import { AddressInfo } from "net";
import { expect } from "chai";
import express from "express";
import { RegionsConfig, runRegions } from "../../src/regions";

/**
 * Without the region hub and signing key (private regions not added), the regions HTTP API is
 * not mounted: every route answers like an unknown path, with no hint that regions exist.
 */
describe("@apiserver[regions/disabled] no private regions without the hub", function () {
  let server: Server;
  let base: string;
  let unknown: { status: number; body: string };
  let runtime: Awaited<ReturnType<typeof runRegions>>;

  const routes: [string, string][] = [
    ["GET", "/.well-known/region-keys.json"],
    ["POST", "/api/regions/enroll"],
    ["GET", "/api/admin/regions"],
    ["POST", "/api/admin/regions"],
    ["POST", "/api/admin/regions/default/token"],
    ["POST", "/api/admin/regions/default/publish"],
    ["POST", "/api/admin/regions/default/revoke"],
    ["GET", "/api/regions"],
    ["POST", "/api/regions"],
    ["GET", "/api/regions/current"],
    ["GET", "/api/regions/default"],
    ["PATCH", "/api/regions/default"],
    ["POST", "/api/regions/default/token"],
    ["POST", "/api/regions/default/disconnect"],
    ["DELETE", "/api/regions/default"]
  ];

  const call = async (method: string, path: string) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-operator-key": "an-operator-key-long-enough"
      },
      body: method === "GET" ? undefined : "{}"
    });
    return { status: res.status, body: await res.text() };
  };

  before(async function () {
    const config = {
      public: [{ id: "default", name: "Default", default: true }],
      allowInsecureLeaf: false,
      relay: {
        firstChunkTimeoutMs: 5000,
        idleTimeoutMs: 10000,
        maxBytes: 1024,
        maxConcurrent: 8
      },
      configDebounceMs: 0,
      // Even with the operator key set, the admin API needs the hub.
      operatorKey: "an-operator-key-long-enough"
    } as RegionsConfig;
    runtime = await runRegions(config, {
      db: {} as never,
      identityPublicKey: "unused",
      issuer: "https://api.example.com",
      defaultControlPlaneUrl: "https://api.example.com",
      defaultLeafUrl: "tls://api.example.com:7422",
      currentVersion: "0.27.0",
      sources: {} as never,
      rootDomain: () => "fonoster.example"
    });
    const app = express();
    for (const r of runtime.routers) app.use(r.path, r.router);
    server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    unknown = await call("GET", "/api/nothing-here");
  });

  after(async function () {
    await runtime?.close();
    server?.close();
  });

  it("reports private regions off and mounts no routers", function () {
    expect(runtime.privateRegions).to.equal(false);
    expect(runtime.routers).to.deep.equal([]);
  });

  for (const [method, path] of routes)
    it(`${method} ${path} answers 404 like an unknown path`, async function () {
      const res = await call(method, path);

      expect(res.status).to.equal(404);
      expect(unknown.status).to.equal(404);
      // Same page as any unknown path (express echoes the path, nothing more).
      const other = await call(method, "/api/nothing-here");
      expect(res.body).to.equal(other.body.replace("/api/nothing-here", path));
    });
});
