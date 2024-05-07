/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { TEST_TOKEN } from "../testToken";
import { DomainsAPI } from "../../dist/domains/client";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

// function updateDomain(domains: DomainsAPI) {
//   return async (
//     call: { request: UpdateDomainRequest },
//     callback: (error: GRPCErrors, response?: UpdateDomainResponse) => void
//   ) => {
//     try {
//       const { ref, name, accessControlListRef, egressPolicies } = call.request;

//       const token = getTokenFromCall(
//         call as unknown as grpc.ServerInterceptingCall
//       );

//       const accessKeyId = getAccessKeyIdFromToken(token);

//       logger.verbose("call to updateDomain", { ref, name });

//       const response = await domains.updateDomain({
//         ref,
//         name,
//         accessControlListRef,
//         egressPolicies,
//         extended: {
//           accessKeyId
//         }
//       });

//       callback(null, {
//         ref: response.ref
//       });
//     } catch (error) {
//       handleError(error, callback);
//     }
//   };
// }

describe("@sipnet[domains/updateDomain]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a domain", async function () {
    // Arrange
    const { updateDomain } = await import("../../src/domains/updateDomain");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domains = {
      updateDomain: sandbox.stub().resolves({ ref: "123" })
    } as unknown as DomainsAPI;

    const call = {
      metadata,
      request: {
        ref: "123",
        name: "My Domain",
        accessControlListRef: "123",
        egressPolicies: []
      }
    };

    const callback = sandbox.stub();

    // Act
    await updateDomain(domains)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "123" });
  });

  it("should throw an error if the domain doesn't exists", async function () {
    // Arrange
    const { updateDomain } = await import("../../src/domains/updateDomain");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domains = {
      updateDomain: sandbox.stub().throws({
        code: grpc.status.NOT_FOUND,
        message: "Domain not found"
      })
    } as unknown as DomainsAPI;

    const call = {
      metadata,
      request: {
        ref: "123",
        name: "My Domain",
        accessControlListRef: "123",
        egressPolicies: []
      }
    };

    const callback = sandbox.stub();

    // Act
    await updateDomain(domains)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.NOT_FOUND,
      message: "The requested resource was not found"
    });
  });
});
