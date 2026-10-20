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
// The caller's workspace owns every `from` (the C2 ownership check passes).
const ownNumber = async () => true;

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
    await createCall(applications, publisher, ownNumber)(call, sandbox.stub());

    // Assert
    expect(publisher.publishCall).to.have.been.calledOnce;
    expect(applications.application.findUnique).to.have.been.calledOnce;
    expect(publisher.publishCall).to.have.been.calledWithMatch({
      from: "+1234567890",
      to: "+1234567891",
      appRef: TEST_UUID
    });
  });

  it("fails with RESOURCE_EXHAUSTED when no Roomr node takes the call", async function () {
    const { createCall } = await import("../../src/calls/createCall");
    const { CallPlacementError } = await import("../../src/calls/types");
    const metadata = new Metadata();
    metadata.set("token", TEST_TOKEN);
    const publisher = {
      publishCall: sandbox
        .stub()
        .rejects(new CallPlacementError("no_capacity", "no Roomr node"))
    };
    const applications = {
      application: {
        findUnique: sandbox.stub().resolves({ ref: TEST_UUID })
      }
    } as unknown as Prisma;
    const callback = sandbox.stub();

    await createCall(
      applications,
      publisher,
      ownNumber
    )(
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

    await createCall(
      applications,
      publisher,
      ownNumber
    )(
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

  it("passes the node's INVALID_ARGUMENT and ALREADY_EXISTS through", async function () {
    const { createCall } = await import("../../src/calls/createCall");
    const { CallPlacementError } = await import("../../src/calls/types");
    for (const [code, want] of [
      ["invalid_argument", status.INVALID_ARGUMENT],
      ["already_exists", status.ALREADY_EXISTS]
    ] as const) {
      const metadata = new Metadata();
      metadata.set("token", TEST_TOKEN);
      const publisher = {
        publishCall: sandbox.stub().rejects(new CallPlacementError(code, code))
      };
      const applications = {
        application: {
          findUnique: sandbox.stub().resolves({ ref: TEST_UUID })
        }
      } as unknown as Prisma;
      const callback = sandbox.stub();
      await createCall(
        applications,
        publisher,
        ownNumber
      )(
        {
          metadata,
          request: { from: "+1234567890", to: "+1234567891", appRef: TEST_UUID }
        },
        callback
      );
      expect(callback.firstCall.args[0]).to.include({ code: want });
    }
  });

  it("refuses a from that is another workspace's number with PERMISSION_DENIED", async function () {
    const { createCall } = await import("../../src/calls/createCall");
    const { createIsWorkspaceNumber } =
      await import("../../src/calls/createIsWorkspaceNumber");
    const metadata = new Metadata();
    metadata.set("token", TEST_TOKEN);
    metadata.set("accessKeyId", "WO00000000000000000000000000000000");
    const publisher = { publishCall: sandbox.stub() };
    const applications = {
      application: { findUnique: sandbox.stub().resolves({ ref: TEST_UUID }) }
    } as unknown as Prisma;
    const numbers = {
      listNumbers: sandbox.stub().resolves({
        items: [
          {
            telUrl: "tel:+15550001111",
            extended: { accessKeyId: "WOtherworkspace00000000000000000000" }
          }
        ],
        nextPageToken: ""
      })
    };
    const callback = sandbox.stub();

    await createCall(
      applications,
      publisher,
      createIsWorkspaceNumber(numbers)
    )(
      {
        metadata,
        request: { from: "+15550001111", to: "+15550002222", appRef: TEST_UUID }
      },
      callback
    );

    expect(callback.firstCall.args[0]).to.include({
      code: status.PERMISSION_DENIED
    });
    expect(publisher.publishCall).to.not.have.been.called;
  });

  it("places the call when from is one of the workspace's numbers", async function () {
    const { createCall } = await import("../../src/calls/createCall");
    const { createIsWorkspaceNumber } =
      await import("../../src/calls/createIsWorkspaceNumber");
    const accessKeyId = "WO00000000000000000000000000000000";
    const metadata = new Metadata();
    metadata.set("token", TEST_TOKEN);
    metadata.set("accessKeyId", accessKeyId);
    const publisher = { publishCall: sandbox.stub().resolves() };
    const applications = {
      application: { findUnique: sandbox.stub().resolves({ ref: TEST_UUID }) }
    } as unknown as Prisma;
    // The number is on the second page, after another workspace's numbers.
    const listNumbers = sandbox.stub();
    listNumbers.onFirstCall().resolves({
      items: [
        {
          telUrl: "tel:+15550001111",
          extended: { accessKeyId: "WOtherworkspace00000000000000000000" }
        }
      ],
      nextPageToken: "p2"
    });
    listNumbers.onSecondCall().resolves({
      items: [{ telUrl: "tel:+15550001111", extended: { accessKeyId } }],
      nextPageToken: ""
    });
    const callback = sandbox.stub();

    await createCall(
      applications,
      publisher,
      createIsWorkspaceNumber({ listNumbers })
    )(
      {
        metadata,
        request: { from: "+15550001111", to: "+15550002222", appRef: TEST_UUID }
      },
      callback
    );

    expect(callback).to.have.been.calledOnce;
    expect(callback.firstCall.args[0]).to.equal(null);
    expect(publisher.publishCall).to.have.been.calledWithMatch({
      from: "+15550001111",
      accessKeyId
    });
  });

  it("refuses a from or to that is not a valid number or SIP target", async function () {
    const { createCall } = await import("../../src/calls/createCall");
    const metadata = new Metadata();
    metadata.set("token", TEST_TOKEN);
    const publisher = { publishCall: sandbox.stub() };
    const applications = {
      application: { findUnique: sandbox.stub().resolves({ ref: TEST_UUID }) }
    } as unknown as Prisma;

    for (const request of [
      { from: "+1555\r\nX-Dod-Number: +1", to: "+15550002222" },
      { from: "+15550001111", to: "+1555\r\nVia: x" }
    ]) {
      const callback = sandbox.stub();
      await createCall(
        applications,
        publisher,
        ownNumber
      )({ metadata, request: { ...request, appRef: TEST_UUID } }, callback);
      expect(callback.firstCall.args[0]).to.include({
        code: status.INVALID_ARGUMENT
      });
    }
    expect(publisher.publishCall).to.not.have.been.called;
  });

  it("refuses a call the authorization service refuses, before placing it", async function () {
    const { createCall } = await import("../../src/calls/createCall");
    const metadata = new Metadata();
    metadata.set("token", TEST_TOKEN);
    const publisher = { publishCall: sandbox.stub() };
    const applications = {
      application: {
        findUnique: sandbox.stub().resolves({ ref: TEST_UUID })
      }
    } as unknown as Prisma;
    const admit = sandbox
      .stub()
      .resolves({ authorized: false, reason: "insufficient_balance" });
    const callback = sandbox.stub();

    await createCall(
      applications,
      publisher,
      ownNumber,
      admit
    )(
      {
        metadata,
        request: { from: "+1234567890", to: "+1234567891", appRef: TEST_UUID }
      },
      callback
    );

    expect(admit).to.have.been.calledWithMatch({
      appRef: TEST_UUID,
      from: "+1234567890",
      to: "+1234567891"
    });
    expect(publisher.publishCall).to.not.have.been.called;
    expect(callback.firstCall.args[0]).to.include({
      code: status.FAILED_PRECONDITION
    });
    expect(callback.firstCall.args[0].message).to.include(
      "insufficient_balance"
    );
  });

  it("places a call the authorization service admits", async function () {
    const { createCall } = await import("../../src/calls/createCall");
    const metadata = new Metadata();
    metadata.set("token", TEST_TOKEN);
    const publisher = { publishCall: sandbox.stub().resolves() };
    const applications = {
      application: {
        findUnique: sandbox.stub().resolves({ ref: TEST_UUID })
      }
    } as unknown as Prisma;
    const callback = sandbox.stub();

    await createCall(
      applications,
      publisher,
      ownNumber,
      sandbox.stub().resolves({ authorized: true })
    )(
      {
        metadata,
        request: { from: "+1234567890", to: "+1234567891", appRef: TEST_UUID }
      },
      callback
    );

    expect(publisher.publishCall).to.have.been.calledOnce;
    expect(callback.firstCall.args[1]).to.have.property("ref");
  });
});
