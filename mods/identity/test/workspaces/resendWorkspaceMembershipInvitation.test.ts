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
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { Prisma } from "../../src/db";
import { IdentityConfig } from "../../src/exchanges/types";
import { TEST_PRIVATE_KEY, TEST_TOKEN } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@identity[workspace/resendWorkspaceMembershipInvitation]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should resend a workspace membership invitation", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const userRef = "635c0cd8-8125-483d-b467-05c53ce2cd31";

    const call = {
      metadata,
      request: {
        userRef
      }
    };

    const identityConfig = {
      smtpConfig: {
        host: "smtp.example.com",
        port: 587,
        secure: true,
        sender: "Fonoster <info@fonoster.local>",
        auth: {}
      },
      privateKey: TEST_PRIVATE_KEY
    } as IdentityConfig;

    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({
          ref: "123",
          ownerRef: userRef,
          members: [
            {
              userRef,
              role: "ADMIN"
            }
          ]
        })
      },
      workspaceMember: {
        findFirst: sandbox.stub().resolves({
          user: {
            email: "john@example.com",
            password: "123456"
          },
          workspace: {
            name: "Test Workspace"
          }
        })
      }
    } as unknown as Prisma;

    const sendInvite = sandbox.stub().resolves();

    // Act
    const { createResendWorkspaceMembershipInvitation } = await import(
      "../../src/workspaces/createResendWorkspaceMembershipInvitation"
    );

    const callback = sandbox.stub();

    await createResendWorkspaceMembershipInvitation(
      prisma,
      identityConfig,
      sendInvite
    )(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWith(null, {
      userRef
    });
  });

  it("should return PERMISSION_DENIED if user is not an admin", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const userRef = "635c0cd8-8125-483d-b467-05c53ce2cd31";

    const call = {
      metadata,
      request: {
        workspaceRef: "123",
        userRef
      }
    };

    const identity = {} as IdentityConfig;

    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({
          ownerRef: "another-user",
          members: [
            {
              userRef,
              role: "USER"
            }
          ]
        })
      }
    } as unknown as Prisma;

    const sendInvite = sandbox.stub().resolves();

    // Act
    const { createResendWorkspaceMembershipInvitation } = await import(
      "../../src/workspaces/createResendWorkspaceMembershipInvitation"
    );

    createResendWorkspaceMembershipInvitation(
      prisma,
      identity,
      sendInvite
    )(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.PERMISSION_DENIED,
        message: "Only admins or owners can remove users from a workspace"
      });
    });
  });
});
