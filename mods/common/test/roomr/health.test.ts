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
import { checkGrpcHealth } from "../../src/roomr";

// The region agent's AppBridge readiness (redesign-roomr 15.5): the standard gRPC health check.
describe("@common/roomr checkGrpcHealth", function () {
  let server: grpc.Server;
  let health: HealthImplementation;
  let address: string;

  before(async () => {
    server = new grpc.Server();
    health = new HealthImplementation({ "": "SERVING" });
    health.addToServer(server);
    const port = await new Promise<number>((resolve, reject) =>
      server.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createInsecure(),
        (e, p) => (e ? reject(e) : resolve(p))
      )
    );
    address = `127.0.0.1:${port}`;
  });

  after(() => server.forceShutdown());

  it("is true while the server reports SERVING, false once it reports NOT_SERVING", async function () {
    expect(await checkGrpcHealth(address)).to.equal(true);
    health.setStatus("", "NOT_SERVING");
    expect(await checkGrpcHealth(address)).to.equal(false);
    health.setStatus("", "SERVING");
  });

  it("is false when nothing answers", async function () {
    expect(await checkGrpcHealth("127.0.0.1:1", 500)).to.equal(false);
  });
});
