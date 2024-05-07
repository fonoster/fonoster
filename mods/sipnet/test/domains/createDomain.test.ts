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
import { getExtendedFieldsHelper } from "../getExtendedFieldsHelper";
import { TEST_TOKEN } from "../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[domains/createDomain]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a domain", async function () {
    // Arrange
    const { createDomain } = await import("../../src/domains/createDomain");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domains = {
      createDomain: sandbox.stub().resolves({ ref: "123" }),
      getDomain: getExtendedFieldsHelper(sandbox)
    } as unknown as DomainsAPI;

    const call = {
      metadata,
      request: {
        name: "My Domain",
        domainUri: "sip.local",
        accessControlListRef: "123",
        egressPolicies: [],
        extended: {
          accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p"
        }
      }
    };

    const callback = sandbox.stub();

    // Act
    await createDomain(domains)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "123" });
  });

  it("should throw an error if the domain already exists", async function () {
    // Arrange
    const { createDomain } = await import("../../src/domains/createDomain");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domains = {
      createDomain: sandbox.stub().throws({
        code: grpc.status.ALREADY_EXISTS,
        message: "Domain already exists"
      }),
      getDomain: getExtendedFieldsHelper(sandbox)
    } as unknown as DomainsAPI;

    const call = {
      metadata,
      request: {
        name: "My Domain",
        domainUri: "sip.local",
        accessControlListRef: "123",
        egressPolicies: []
      }
    };

    const callback = sandbox.stub();

    // Act
    await createDomain(domains)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.ALREADY_EXISTS,
      message: "Duplicated resource"
    });
  });
});
