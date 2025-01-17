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
import { NumbersApi } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { TEST_TOKEN } from "./testToken";
import { APP_REF_HEADER, ROUTR_DEFAULT_PEER_AOR } from "@fonoster/common";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const TELEPHONE_NUMBER = "+1234567890";

describe("@sipnet[sipnet/createNumber]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a number resource", async function () {
    // Arrange
    const { createNumber } = await import("../src/numbers/createNumber");
    const accessKeyId = "GRahn02s8tgdfghz72vb0fz538qpb5z35p";
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    metadata.set("accesskeyid", accessKeyId);

    const numbers = {
      createNumber: sandbox.stub().resolves({ ref: "123" })
    } as unknown as NumbersApi;

    const call = {
      metadata,
      request: {
        name: "My Number",
        telUrl: TELEPHONE_NUMBER,
        city: "New York",
        country: "USA",
        countryIsoCode: "US",
        appRef: "123",
        trunkRef: "456"
      }
    };

    const callback = sandbox.stub();
    const checkNumberPreconditions = sandbox.stub();

    const create = createNumber(numbers, checkNumberPreconditions);

    // Act
    await create(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "123" });
    expect(numbers.createNumber).to.have.been.calledOnceWith({
      name: call.request.name,
      telUrl: call.request.telUrl,
      city: call.request.city,
      aorLink: ROUTR_DEFAULT_PEER_AOR,
      country: call.request.country,
      countryIsoCode: call.request.countryIsoCode,
      extraHeaders: [{ name: APP_REF_HEADER, value: call.request.appRef }],
      extended: { accessKeyId },
      trunkRef: call.request.trunkRef
    });
  });

  it("should throw a validation error if the country ISO code is invalid", async function () {
    // Arrange
    const { createNumber } = await import("../src/numbers/createNumber");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const numbers = {
      createNumber: sandbox.stub().resolves({ ref: "123" })
    } as unknown as NumbersApi;

    const call = {
      metadata,
      request: {
        name: "My Number",
        telUrl: TELEPHONE_NUMBER,
        city: "New York",
        country: "USA",
        countryIsoCode: "USA",
        appRef: "123"
      }
    };

    const callback = sandbox.stub();
    const checkNumberPreconditions = sandbox.stub();

    const create = createNumber(numbers, checkNumberPreconditions);

    // Act
    await create(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.INVALID_ARGUMENT,
      message: "Invalid country ISO code"
    });
    expect(numbers.createNumber).to.not.have.been.called;
  });

  it("should throw a validation error if the SIP URI is invalid", async function () {
    // Arrange
    const { createNumber } = await import("../src/numbers/createNumber");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const numbers = {
      createNumber: sandbox.stub().resolves({ ref: "123" })
    } as unknown as NumbersApi;

    const call = {
      metadata,
      request: {
        name: "My Number",
        telUrl: TELEPHONE_NUMBER,
        city: "New York",
        country: "USA",
        countryIsoCode: "US",
        agentAor: "sip:123"
      }
    };

    const callback = sandbox.stub();
    const checkNumberPreconditions = sandbox.stub();

    const create = createNumber(numbers, checkNumberPreconditions);

    // Act
    await create(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.INVALID_ARGUMENT,
      // eslint-disable-next-line prettier/prettier
      message: "Invalid SIP URI at \"agentAor\""
    });
  });

  it("should throw a precondition error if the appRef does not exist", async function () {
    // Arrange
    const { createNumber } = await import("../src/numbers/createNumber");
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const numbers = {
      createNumber: sandbox.stub().resolves({ ref: "123" })
    } as unknown as NumbersApi;

    const call = {
      metadata,
      request: {
        name: "My Number",
        telUrl: TELEPHONE_NUMBER,
        city: "New York",
        country: "USA",
        countryIsoCode: "US",
        appRef: "123"
      }
    };

    const callback = sandbox.stub();

    const checkNumberPreconditions = sandbox.stub().throws({
      code: grpc.status.INVALID_ARGUMENT,
      message: "The application does not exist"
    });

    const create = createNumber(numbers, checkNumberPreconditions);

    // Act
    await create(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.INVALID_ARGUMENT,
      message: "The application does not exist"
    });
    expect(numbers.createNumber).to.not.have.been.called;
  });
});
