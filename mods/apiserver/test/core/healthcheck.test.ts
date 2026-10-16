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
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import { HealthImplementation } from "grpc-health-check";
import { checkHealth } from "../../src/bin/healthcheck";

describe("@apiserver[healthcheck] container probe", function () {
  let server: grpc.Server;
  let health: HealthImplementation;
  let address: string;

  before(async function () {
    server = new grpc.Server();
    health = new HealthImplementation({ "": "NOT_SERVING" });
    health.addToServer(server);
    const port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createInsecure(),
        (err, p) => (err ? reject(err) : resolve(p))
      )
    );
    address = `127.0.0.1:${port}`;
  });

  after(() => server.forceShutdown());

  it("fails while the server is not serving", async function () {
    expect(await checkHealth(address)).to.equal(false);
  });

  it("passes once the server reports SERVING", async function () {
    health.setStatus("", "SERVING");
    expect(await checkHealth(address)).to.equal(true);
  });

  it("fails when nothing listens", async function () {
    expect(await checkHealth("127.0.0.1:1", 500)).to.equal(false);
  });
});
