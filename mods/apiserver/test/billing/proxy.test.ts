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
import { createServiceDefinition } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import { buildService } from "../../src/billing/buildService";

// The apiserver's Billing API (add-billing-service 6.1): passed to the billing service for the
// workspace owner only, with owner_ref always the caller's.

describe("@apiserver/billing proxy", function () {
  let server: grpc.Server;
  let address: string;
  const seen: Record<string, unknown>[] = [];

  before(async () => {
    server = new grpc.Server();
    server.addService(
      createServiceDefinition({
        serviceName: "Billing",
        pckg: "billing",
        proto: "billing.proto",
        version: "v1beta2"
      }),
      {
        getBilling: (
          call: grpc.ServerUnaryCall<Record<string, unknown>, unknown>,
          cb: grpc.sendUnaryData<unknown>
        ) => {
          seen.push(call.request);
          cb(null, { plan: "trial", balance: 1000 });
        },
        createTopUp: (_: unknown, cb: grpc.sendUnaryData<unknown>) =>
          cb({
            code: grpc.status.FAILED_PRECONDITION,
            details: "add a payment method before buying credits"
          })
      }
    );
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

  const invoke = (owner: string | undefined, method: string, request: object) =>
    new Promise<{
      error: Partial<grpc.ServiceError> | null;
      response?: unknown;
    }>((resolve) =>
      (
        buildService(address, () => owner).handlers[method] as (
          c: object,
          cb: (e: unknown, r?: unknown) => void
        ) => void
      )({ request }, (error, response) =>
        resolve({ error: error as Partial<grpc.ServiceError> | null, response })
      )
    );

  it("asks for the caller's billing, whatever owner the request names", async () => {
    const { error, response } = await invoke("user-1", "getBilling", {
      ownerRef: "someone-else"
    });
    expect(error).to.equal(null);
    expect(response).to.include({ plan: "trial", balance: 1000 });
    expect(seen.at(-1)).to.include({ ownerRef: "user-1" });
  });

  it("refuses a caller who does not own the workspace", async () => {
    const { error } = await invoke(undefined, "getBilling", {});
    expect(error).to.include({ code: grpc.status.PERMISSION_DENIED });
  });

  it("passes the billing service's refusals through", async () => {
    const { error } = await invoke("user-1", "createTopUp", { credits: 1000 });
    expect(error).to.include({
      code: grpc.status.FAILED_PRECONDITION,
      message: "add a payment method before buying credits"
    });
  });
});
