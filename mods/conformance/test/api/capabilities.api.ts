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
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { parseConfigFile, strictDeep } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import * as SDK from "../../../sdk/src/node";
import { createDrivers } from "./drivers";
import { getWorld, World } from "./world";

// capabilities: GetCapabilities as configured (API-055 to API-057 in
// mods/conformance/catalog/areas/api.md). Each configuration gets its own Capabilities server,
// built the way the apiserver builds it, from a fonoster.yaml.

const FIXTURE = resolve(__dirname, "../../../apiserver/test/fixtures/fonoster.test.yaml");

async function serveCapabilities(patch: Record<string, unknown>) {
  const { fonosterConfigSchema } = await import("../../../apiserver/src/config");
  const { buildCapabilitiesService } = await import("../../../apiserver/src/capabilities");
  const { default: loadServices } = await import("../../../apiserver/src/core/loadServices");
  const raw = parseConfigFile(FIXTURE, readFileSync(FIXTURE, "utf8")) as Record<string, unknown>;
  const config = strictDeep(fonosterConfigSchema).parse({ ...raw, ...patch });
  const server = new grpc.Server();
  await loadServices(server, [buildCapabilitiesService(config) as never]);
  const port = await new Promise<number>((done, fail) =>
    server.bindAsync("127.0.0.1:0", grpc.ServerCredentials.createInsecure(), (e, p) => (e ? fail(e) : done(p)))
  );
  return {
    get: () =>
      createDrivers(`127.0.0.1:${port}`)
        .find((d) => d.name === "grpc")!
        .call<Record<string, unknown>>(undefined, "Capabilities", "getCapabilities", {}),
    stop: () => new Promise<void>((done) => server.tryShutdown(() => done()))
  };
}

describe("@api capabilities", function () {
  this.timeout(30_000);
  let world: World;

  before(async function () {
    world = await getWorld();
  });

  it("[API-055] without features.auth, GetCapabilities offers password sign-in by invite and no GitHub", async function () {
    const server = await serveCapabilities({});
    try {
      const caps = await server.get();
      expect(JSON.stringify(caps)).to.match(/"methods":\["password"\]/);
      expect(JSON.stringify(caps)).to.match(/"signup":"invite"/);
      expect(JSON.stringify(caps)).to.not.match(/"github":\{[^}]*clientId/i);
    } finally {
      await server.stop();
    }
  });

  it("[API-056] with GitHub and email codes, GetCapabilities returns both and the client id, never the secret", async function () {
    const raw = parseConfigFile(FIXTURE, readFileSync(FIXTURE, "utf8")) as { identity: Record<string, unknown> };
    const server = await serveCapabilities({
      features: { auth: { methods: ["github", "email_code"], signup: "open" } },
      identity: { ...raw.identity, oauth2: { github: { clientId: "Iv1.github-client-id", clientSecret: "github-client-secret-value" } } }
    });
    try {
      const text = JSON.stringify(await server.get());
      expect(text).to.contain("github");
      expect(text).to.contain("email_code");
      expect(text).to.contain("Iv1.github-client-id");
      expect(text).to.not.contain("github-client-secret-value");
    } finally {
      await server.stop();
    }
  });

  it("[API-057] GetCapabilities needs no credentials, through the SDK and gRPC", async function () {
    const client = new SDK.Client({ endpoint: world.stack.endpoint, accessKeyId: "", allowInsecure: true, withoutInterceptors: true });
    expect(await client.getCapabilities()).to.be.an("object");
    expect(await world.raw.call(undefined, "Capabilities", "getCapabilities", {})).to.be.an("object");
  });
});
