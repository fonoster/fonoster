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
import { TEST_TOKEN } from "../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@sipnet[domains/getDomain]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should get a domain", async function () {
    // Arrange
    const { getDomain } = await import("../../src/domains/getDomain");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domain = {
      ref: "123",
      name: "SIP Local",
      domainUri: "sip.local",
      extended: {
        accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p"
      }
    };

    const domains = {
      getDomain: sandbox.stub().resolves(domain)
    } as unknown as DomainsAPI;

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    // Act
    await getDomain(domains)(call, (error, response) => {
      // Assert
      expect(error).to.be.null;
      expect(response).to.deep.equal(domain);
    });
  });

  it("should throw an error if domain not found", async function () {
    // Arrange
    const { getDomain } = await import("../../src/domains/getDomain");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const domains = {
      getDomain: sandbox.stub().throws({
        code: grpc.status.NOT_FOUND,
        message: "Domain not found"
      })
    } as unknown as DomainsAPI;

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const callback = sandbox.stub();

    // Act
    await getDomain(domains)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnce;
    expect(callback).to.have.been.calledWithMatch({
      code: grpc.status.NOT_FOUND,
      message: "The requested resource was not found"
    });
  });
});
