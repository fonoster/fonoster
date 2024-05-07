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
import { getExtendedFieldsHelper } from "../getExtendedFieldsHelper";
import { TEST_TOKEN } from "../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[agents/listAgents]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should list agents", async function () {
    // Arrange
    const { listAgents } = await import("../../src/agents/listAgents");
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
      metadata: {
        accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p"
      }
    };

    const agents = {
      listAgents: sandbox.stub().resolves({
        items: [agent],
        nextPageToken: ""
      }),
      getAgent: getExtendedFieldsHelper(sandbox)
    } as unknown as AgentsAPI;

    const call = {
      metadata,
      request: {
        pageSize: 10,
        pageToken: ""
      }
    };

    // Act
    await listAgents(agents)(call, (error, response) => {
      // Assert
      expect(error).to.be.null;
      expect(response).to.deep.equal({
        items: [agent],
        nextPageToken: ""
      });
    });

    // Assert
    expect(agents.listAgents).to.have.been.calledOnce;
    expect(agents.listAgents).to.have.been.calledWith({
      pageSize: 10,
      pageToken: ""
    });
  });
});
