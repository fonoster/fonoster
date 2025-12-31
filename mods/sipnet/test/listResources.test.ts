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
import { Domain, DomainExtended, DomainsApi, ListDomainsRequest } from "@fonoster/types";
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
    await new Promise<void>((resolve, reject) => {
      list(call, (error, response) => {
        try {
          // Assert
          expect(error).to.be.null;
          expect(response).to.not.be.null;
          const typedResponse = response as { items: DomainExtended[]; nextPageToken?: string };
          expect(typedResponse.items).to.have.length(1);
          expect(typedResponse.items[0].ref).to.equal("123");
          // When items.length < pageSize, nextPageToken should be undefined
          expect(typedResponse.nextPageToken).to.be.undefined;
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });

    // Assert
    expect(domains.listDomains).to.have.been.calledOnce;
    // Empty string pageToken should be normalized to undefined
    expect(domains.listDomains).to.have.been.calledWith({
      pageSize: 20, // Requested pageSize * 2 to account for filtering
      pageToken: undefined
    });
  });

  it("should paginate through pages when first pages contain items from other customers", async function () {
    // Arrange
    const { listResources } = await import("../src/resources/listResources");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const currentAccessKeyId = "WO00000000000000000000000000000000";
    const otherAccessKeyId = "WO11111111111111111111111111111111";
    metadata.set("accesskeyid", currentAccessKeyId);

    // First page: items from other customer
    const otherCustomerDomain1 = {
      ref: "other-1",
      name: "Other Customer Domain 1",
      domainUri: "other1.example.com",
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      extended: {
        accessKeyId: otherAccessKeyId
      }
    };

    const otherCustomerDomain2 = {
      ref: "other-2",
      name: "Other Customer Domain 2",
      domainUri: "other2.example.com",
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      extended: {
        accessKeyId: otherAccessKeyId
      }
    };

    // Second page: items from current customer
    const currentCustomerDomain1 = {
      ref: "current-1",
      name: "Current Customer Domain 1",
      domainUri: "current1.example.com",
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      extended: {
        accessKeyId: currentAccessKeyId
      }
    };

    const currentCustomerDomain2 = {
      ref: "current-2",
      name: "Current Customer Domain 2",
      domainUri: "current2.example.com",
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      extended: {
        accessKeyId: currentAccessKeyId
      }
    };

    const listDomainsStub = sandbox.stub();
    // First call: return items from other customer
    listDomainsStub.onCall(0).resolves({
      items: [otherCustomerDomain1, otherCustomerDomain2],
      nextPageToken: "page-2-token"
    });
    // Second call: return items from current customer
    listDomainsStub.onCall(1).resolves({
      items: [currentCustomerDomain1, currentCustomerDomain2],
      nextPageToken: "page-3-token"
    });

    const domains = {
      listDomains: listDomainsStub,
      getDomain: getExtendedFieldsHelper(sandbox)
    } as unknown as DomainsApi;

    const call = {
      metadata,
      request: {
        pageSize: 20,
        pageToken: "" // Empty string should be normalized
      }
    };

    const list = listResources<Domain, ListDomainsRequest, DomainsApi>(
      domains,
      "Domain"
    );

    // Act
    await new Promise<void>((resolve, reject) => {
      list(call, (error, response) => {
        try {
          // Assert
          expect(error).to.be.null;
          expect(response).to.not.be.null;
          const typedResponse = response as { items: DomainExtended[]; nextPageToken?: string };
          expect(typedResponse.items).to.have.length(2);
          expect(typedResponse.items[0].ref).to.equal("current-1");
          expect(typedResponse.items[1].ref).to.equal("current-2");
          expect((typedResponse.items[0].extended as { accessKeyId: string }).accessKeyId).to.equal(
            currentAccessKeyId
          );
          expect((typedResponse.items[1].extended as { accessKeyId: string }).accessKeyId).to.equal(
            currentAccessKeyId
          );
          // Backend returned fewer items than requested (2 < 40), so this is the last page
          expect(typedResponse.nextPageToken).to.be.undefined;

          // Verify pagination occurred
          expect(listDomainsStub).to.have.been.calledTwice;
          // First call should have undefined pageToken (normalized from empty string)
          expect(listDomainsStub.getCall(0)).to.have.been.calledWith({
            pageSize: 40, // pageSize * 2
            pageToken: undefined
          });
          // Second call should use the nextPageToken from first response
          expect(listDomainsStub.getCall(1)).to.have.been.calledWith({
            pageSize: 40,
            pageToken: "page-2-token"
          });

          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it("should NOT return nextPageToken when on the last page (backend returns fewer items than requested)", async function () {
    // Arrange
    const { listResources } = await import("../src/resources/listResources");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const currentAccessKeyId = "WO00000000000000000000000000000000";
    metadata.set("accesskeyid", currentAccessKeyId);

    // Create 3 items from current customer - this is less than backendRequestedSize (pageSize * 2 = 20)
    // so it should be detected as the last page
    const currentCustomerDomains = [
      {
        ref: "current-1",
        name: "Current Customer Domain 1",
        domainUri: "current1.example.com",
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        extended: { accessKeyId: currentAccessKeyId }
      },
      {
        ref: "current-2",
        name: "Current Customer Domain 2",
        domainUri: "current2.example.com",
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        extended: { accessKeyId: currentAccessKeyId }
      },
      {
        ref: "current-3",
        name: "Current Customer Domain 3",
        domainUri: "current3.example.com",
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
        extended: { accessKeyId: currentAccessKeyId }
      }
    ];

    // Backend returns fewer items than requested (3 < 20) but still provides a nextPageToken
    // This simulates cursor-based pagination where the token is always the last item's cursor
    const domains = {
      listDomains: sandbox.stub().resolves({
        items: currentCustomerDomains,
        nextPageToken: "some-cursor-token" // Backend may return this even on last page
      }),
      getDomain: getExtendedFieldsHelper(sandbox)
    } as unknown as DomainsApi;

    const call = {
      metadata,
      request: {
        pageSize: 10, // backendRequestedSize will be 20
        pageToken: ""
      }
    };

    const list = listResources<Domain, ListDomainsRequest, DomainsApi>(
      domains,
      "Domain"
    );

    // Act
    await new Promise<void>((resolve, reject) => {
      list(call, (error, response) => {
        try {
          // Assert
          expect(error).to.be.null;
          expect(response).to.not.be.null;
          const typedResponse = response as { items: DomainExtended[]; nextPageToken?: string };
          expect(typedResponse.items).to.have.length(3);

          // CRITICAL: Since backend returned fewer items than requested (3 < 20),
          // this is the last page and nextPageToken should be undefined
          expect(typedResponse.nextPageToken).to.be.undefined;

          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });

  it("should handle empty pageToken and return items when they exist in first page", async function () {
    // Arrange
    const { listResources } = await import("../src/resources/listResources");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const currentAccessKeyId = "WO00000000000000000000000000000000";
    metadata.set("accesskeyid", currentAccessKeyId);

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
        accessKeyId: currentAccessKeyId
      }
    };

    const domains = {
      listDomains: sandbox.stub().resolves({
        items: [domain],
        nextPageToken: undefined
      }),
      getDomain: getExtendedFieldsHelper(sandbox)
    } as unknown as DomainsApi;

    const call = {
      metadata,
      request: {
        pageSize: 20,
        pageToken: "" // Empty string
      }
    };

    const list = listResources<Domain, ListDomainsRequest, DomainsApi>(
      domains,
      "Domain"
    );

    // Act
    await new Promise<void>((resolve, reject) => {
      list(call, (error, response) => {
        try {
          // Assert
          expect(error).to.be.null;
          expect(response).to.not.be.null;
          const typedResponse = response as { items: DomainExtended[]; nextPageToken?: string };
          expect(typedResponse.items).to.have.length(1);
          expect(typedResponse.items[0].ref).to.equal("123");

          // Verify empty string was normalized to undefined
          expect(domains.listDomains).to.have.been.calledOnce;
          expect(domains.listDomains).to.have.been.calledWith({
            pageSize: 40, // pageSize * 2
            pageToken: undefined
          });

          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  });
});
