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
import { AgentsAPI } from "../../dist/agents/client";
import { getExtendedFieldsHelper } from "../getExtendedFieldsHelper";
import { TEST_TOKEN } from "../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[agents/updateAgent]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should update an agent", async function () {
    // Arrange
    const { updateAgent } = await import("../../src/agents/updateAgent");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const agents = {
      updateAgent: sandbox.stub().resolves({ ref: "123" }),
      getAgent: getExtendedFieldsHelper(sandbox)
    } as unknown as AgentsAPI;

    const call = {
      metadata,
      request: {
        ref: "123",
        name: "Jane Doe"
      }
    };

    const callback = sandbox.stub();

    // Act
    await updateAgent(agents)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "123" });
  });

  it("should throw an error if the agent doesn't exists", async function () {
    // Arrange
    const { updateAgent } = await import("../../src/agents/updateAgent");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const agents = {
      updateAgent: sandbox.stub().throws({
        code: grpc.status.NOT_FOUND,
        message: "Domain not found"
      }),
      getAgent: getExtendedFieldsHelper(sandbox)
    } as unknown as AgentsAPI;

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
    await updateAgent(agents)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.NOT_FOUND,
      message: "The requested resource was not found"
    });
  });
});
