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
import { Validators as V } from "@fonoster/common";
import { getExtendedFieldsHelper } from "@fonoster/sipnet/test/getExtendedFieldsHelper";
import { TEST_TOKEN } from "@fonoster/sipnet/test/testToken";
import { Domain, DomainsApi, UpdateDomainRequest } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[resources/updateResource]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should update a sipnet resource", async function () {
    // Arrange
    const { updateResource } = await import("../src/resources/updateResource");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domains = {
      updateDomain: sandbox.stub().resolves({ ref: "123" }),
      getDomain: getExtendedFieldsHelper(sandbox)
    } as unknown as DomainsApi;

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

    const update = updateResource<Domain, UpdateDomainRequest, DomainsApi>(
      domains,
      "Domain",
      V.updateDomainRequestSchema
    );

    // Act
    await update(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "123" });
  });

  it("should throw an error if the sipnet resource doesn't exists", async function () {
    // Arrange
    const { updateResource } = await import("../src/resources/updateResource");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domains = {
      updateDomain: sandbox.stub().throws({
        code: grpc.status.NOT_FOUND,
        message: "The requested resource was not found"
      }),
      getDomain: getExtendedFieldsHelper(sandbox)
    } as unknown as DomainsApi;

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

    const update = updateResource<Domain, UpdateDomainRequest, DomainsApi>(
      domains,
      "Domain",
      V.updateDomainRequestSchema
    );

    // Act
    await update(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.NOT_FOUND,
      message: "The requested resource was not found"
    });
  });
});
