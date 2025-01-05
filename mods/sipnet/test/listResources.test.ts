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
import { getExtendedFieldsHelper } from "@fonoster/sipnet/test/getExtendedFieldsHelper";
import { TEST_TOKEN } from "@fonoster/sipnet/test/testToken";
import { Domain, DomainsApi, ListDomainsRequest } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[resources/listResources]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should list sipnet resources", async function () {
    // Arrange
    const { listResources } = await import("../src/resources/listResources");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    metadata.set("accesskeyid", "WO00000000000000000000000000000000");

    const domain = {
      ref: "123",
      name: "SIP Local",
      domainUri: "sip.fonoster.local",
      metadata: {
        description: "test"
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      extended: {
        accessKeyId: "WO00000000000000000000000000000000"
      }
    };

    const domains = {
      listDomains: sandbox.stub().resolves({
        items: [domain],
        nextPageToken: ""
      }),
      getDomain: getExtendedFieldsHelper(sandbox)
    } as unknown as DomainsApi;

    const call = {
      metadata,
      request: {
        pageSize: 10,
        pageToken: ""
      }
    };

    const list = listResources<Domain, ListDomainsRequest, DomainsApi>(
      domains,
      "Domain"
    );

    // Act
    await list(call, (error, response) => {
      // Assert
      expect(error).to.be.null;
      expect(response).to.deep.equal({
        items: [domain],
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
