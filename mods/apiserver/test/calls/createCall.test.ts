/* eslint-disable prettier/prettier */
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
import { Metadata, status } from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { Prisma } from "../../src/core/db";
import { TEST_TOKEN, TEST_UUID } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@calls/createCall", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a call", async function () {
    // Arrange
    const { createCall } = await import("../../src/calls/createCall");
    const metadata = new Metadata();
    metadata.set("token", TEST_TOKEN);
    const publisher = {
      publishCall: sandbox.stub()
    };
    const call = {
      metadata,
      request: {
        from: "+1234567890",
        to: "+1234567891",
        appRef: TEST_UUID
      }
    };

    const application = {
      ref: TEST_UUID,
      name: "My Application",
      endpoint: "example.com:50051",
      accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const applications = {
      application: {
        findUnique: sandbox.stub().resolves(application)
      }
    } as unknown as Prisma;

    // Act
    await createCall(applications, publisher)(call, sandbox.stub());

    // Assert
    expect(publisher.publishCall).to.have.been.calledOnce;
    expect(applications.application.findUnique).to.have.been.calledOnce;
    expect(publisher.publishCall).to.have.been.calledWithMatch({
      from: "+1234567890",
      to: "+1234567891",
      appRef: TEST_UUID
    });
  });

  it("fails with RESOURCE_EXHAUSTED when no media node takes the call", async function () {
    const { createCall } = await import("../../src/calls/createCall");
    const { CallPlacementError } = await import("../../src/calls/types");
    const metadata = new Metadata();
    metadata.set("token", TEST_TOKEN);
    const publisher = {
      publishCall: sandbox
        .stub()
        .rejects(new CallPlacementError("no_capacity", "no media node"))
    };
    const applications = {
      application: {
        findUnique: sandbox.stub().resolves({ ref: TEST_UUID })
      }
    } as unknown as Prisma;
    const callback = sandbox.stub();

    await createCall(applications, publisher)(
      {
        metadata,
        request: { from: "+1234567890", to: "+1234567891", appRef: TEST_UUID }
      },
      callback
    );

    expect(callback).to.have.been.calledOnce;
    expect(callback.firstCall.args[0]).to.include({
      code: status.RESOURCE_EXHAUSTED
    });
    expect(callback.firstCall.args[1]).to.equal(undefined);
  });

  it("fails with UNAVAILABLE when no placement answers", async function () {
    const { createCall } = await import("../../src/calls/createCall");
    const { CallPlacementError } = await import("../../src/calls/types");
    const metadata = new Metadata();
    metadata.set("token", TEST_TOKEN);
    const publisher = {
      publishCall: sandbox
        .stub()
        .rejects(new CallPlacementError("unavailable", "no responders"))
    };
    const applications = {
      application: {
        findUnique: sandbox.stub().resolves({ ref: TEST_UUID })
      }
    } as unknown as Prisma;
    const callback = sandbox.stub();

    await createCall(applications, publisher)(
      {
        metadata,
        request: { from: "+1234567890", to: "+1234567891", appRef: TEST_UUID }
      },
      callback
    );

    expect(callback.firstCall.args[0]).to.include({
      code: status.UNAVAILABLE
    });
  });
});
