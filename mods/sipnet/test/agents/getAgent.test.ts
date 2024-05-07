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
import { AgentsAPI, Privacy } from "../../src/agents/client";
import { TEST_TOKEN } from "../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[agents/getAgent]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should get a agent", async function () {
    // Arrange
    const { getAgent } = await import("../../src/agents/getAgent");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const agent = {
      ref: "123",
      name: "John Doe",
      username: "myagent",
      domainRef: "123",
      privacy: Privacy.PRIVATE,
      enabled: true,
      maxContacts: 10,
      expires: 600,
      extended: {
        accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p"
      }
    };

    const agents = {
      getAgent: sandbox.stub().resolves(agent)
    } as unknown as AgentsAPI;

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    // Act
    await getAgent(agents)(call, (error, response) => {
      // Assert
      expect(error).to.be.null;
      expect(response).to.deep.equal(agent);
    });
  });

  it("should throw an error if agent not found", async function () {
    // Arrange
    const { getAgent } = await import("../../src/agents/getAgent");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const agents = {
      getAgent: sandbox.stub().throws({
        code: grpc.status.NOT_FOUND,
        message: "Agent not found"
      })
    } as unknown as AgentsAPI;

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const callback = sandbox.stub();

    // Act
    await getAgent(agents)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnce;
    expect(callback).to.have.been.calledWithMatch({
      code: grpc.status.NOT_FOUND,
      message: "The requested resource was not found"
    });
  });
});
