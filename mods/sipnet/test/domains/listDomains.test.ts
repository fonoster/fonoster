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
import { DomainsAPI } from "../../dist/domains/client";
import { getDomainHelper } from "../getDomainHelper";
import { TEST_TOKEN } from "../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[domains/listDomains]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should list domains", async function () {
    // Arrange
    const { listDomains } = await import("../../src/domains/listDomains");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domain = {
      ref: "123",
      name: "SIP Local",
      domainUri: "sip.local",
      metadata: {
        description: "test"
      }
    };

    const domains = {
      listDomains: sandbox.stub().resolves({
        domains: [domain],
        nextPageToken: ""
      }),
      getDomain: getDomainHelper(sandbox)
    } as unknown as DomainsAPI;

    const call = {
      metadata,
      request: {
        pageSize: 10,
        pageToken: ""
      }
    };

    // Act
    await listDomains(domains)(call, (error, response) => {
      // Assert
      expect(error).to.be.null;
      expect(response).to.deep.equal({
        domains: [domain],
        nextPageToken: ""
      });
    });

    // Assert
    expect(domains.listDomains).to.have.been.calledOnce;
    expect(domains.listDomains).to.have.been.calledWith({
      pageSize: 10,
      pageToken: ""
    });
  });
});
