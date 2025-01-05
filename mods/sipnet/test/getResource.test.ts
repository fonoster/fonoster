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
import { TEST_TOKEN } from "@fonoster/sipnet/test/testToken";
import { BaseApiObject, Domain, DomainsApi } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[resources/getResource]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should get a sipnet resource", async function () {
    // Arrange
    const { getResource } = await import("../src/resources/getResource");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domain = {
      ref: "123",
      name: "SIP Local",
      domainUri: "sip.fonoster.local",
      extended: {
        accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const domains = {
      getDomain: sandbox.stub().resolves(domain)
    } as unknown as DomainsApi;

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const get = getResource<Domain, BaseApiObject, DomainsApi>(
      domains,
      "Domain"
    );

    // Act
    await get(call, (error, response) => {
      // Assert
      expect(error).to.be.null;
      expect(response).to.deep.equal(domain);
    });
  });

  it("should throw an error if sipnet resource not found", async function () {
    // Arrange
    const { getResource } = await import("../src/resources/getResource");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domains = {
      getDomain: sandbox.stub().throws({
        code: grpc.status.NOT_FOUND,
        message: "The requested resource was not found"
      })
    } as unknown as DomainsApi;

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const callback = sandbox.stub();
    const get = getResource<Domain, BaseApiObject, DomainsApi>(
      domains,
      "Domain"
    );

    // Act
    await get(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnce;
    expect(callback).to.have.been.calledWithMatch({
      code: grpc.status.NOT_FOUND,
      message: "The requested resource was not found"
    });
  });
});
