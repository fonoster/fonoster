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
import { BaseApiObject, Domain, DomainsApi } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { getExtendedFieldsHelper } from "./getExtendedFieldsHelper";
import { TEST_TOKEN } from "./testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[resources/deleteResource]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should delete a sipnet resource", async function () {
    // Arrange
    const { deleteResource } = await import("../src/resources/deleteResource");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domains = {
      deleteDomain: sandbox.stub().resolves({ ref: "123" }),
      getDomain: getExtendedFieldsHelper(sandbox)
    } as unknown as DomainsApi;

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const callback = sandbox.stub();
    const deleteD = deleteResource<Domain, BaseApiObject, DomainsApi>(
      domains,
      "Domain"
    );

    // Act
    await deleteD(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnce;
    expect(callback).to.have.been.calledWith(null, { ref: "123" });
  });
});
