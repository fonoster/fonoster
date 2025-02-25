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
import { Role } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { Prisma } from "../../src/db";
import { IdentityConfig } from "../../src/exchanges/types";
import { TEST_PRIVATE_KEY, TEST_TOKEN, TEST_UUID } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const workspaceName = "Test Workspace";
const workspaceOwner = "635c0cd8-8125-483d-b467-05c53ce2cd31";
const inviteRequest = {
  workspaceRef: "1",
  email: "john@example.com",
  name: "John Doe",
  role: Role.WORKSPACE_ADMIN,
  password: "12345678"
};

describe("@identity[workspace/inviteUserToWorkspace]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should invite a user to a workspace", async function () {
    // Arrange
    const sendInvite = sandbox.stub();
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: inviteRequest
    };

    const identityConfig = {
      smtpConfig: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        sender: "Fonoster <info@fonoster.local>",
        auth: {}
      },
      privateKey: TEST_PRIVATE_KEY
    } as IdentityConfig;

    const prisma = {
      user: {
        findUnique: sandbox.stub().resolves(),
        create: sandbox.stub().resolves({ ref: TEST_UUID })
      },
      workspaceMember: {
        create: sandbox.stub().resolves({ workspace: { name: workspaceName } }),
        findFirst: sandbox.stub().resolves()
      },
      workspace: {
        findUnique: sandbox.stub().resolves({
          ref: TEST_UUID,
          accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p",
          ownerRef: workspaceOwner,
          members: []
        })
      }
    } as unknown as Prisma;

    const { createInviteUserToWorkspace } = await import(
      "../../src/workspaces/createInviteUserToWorkspace"
    );

    // Act
    await createInviteUserToWorkspace(
      prisma,
      identityConfig,
      sendInvite
    )(call, () => {});

    // Assert
    expect(sendInvite).to.have.been.calledOnce;
    // expect(prisma.user.create).to.have.been.calledOnce;
    // expect(prisma.workspaceMember.create).to.have.been.calledOnce;
  });

  it("should return an error if the user is already a member", async function () {
    // Arrange
    const sendInvite = sandbox.stub();
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: inviteRequest
    };

    const identityConfig = {
      smtpConfig: {
        host: "smtp.example.com",
        port: 587,
        secure: false,
        sender: "Fonoster <info@fonoster.local>",
        auth: {}
      },
      privateKey: TEST_PRIVATE_KEY
    } as IdentityConfig;

    const prisma = {
      user: {
        findUnique: sandbox.stub().resolves({ ref: TEST_TOKEN }),
        create: sandbox.stub().resolves()
      },
      workspaceMember: {
        create: sandbox.stub().resolves({ workspace: { name: workspaceName } }),
        findFirst: sandbox.stub().resolves({ ref: TEST_TOKEN })
      },
      workspace: {
        findUnique: sandbox.stub().resolves({
          ref: TEST_TOKEN,
          accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p",
          ownerRef: workspaceOwner,
          members: []
        })
      }
    } as unknown as Prisma;

    const { createInviteUserToWorkspace } = await import(
      "../../src/workspaces/createInviteUserToWorkspace"
    );

    // Act
    const callback = sandbox.stub();
    await createInviteUserToWorkspace(
      prisma,
      identityConfig,
      sendInvite
    )(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWith({
      code: grpc.status.ALREADY_EXISTS,
      message: "User is already a member of this workspace"
    });
    expect(sendInvite).to.not.have.been.called;
    expect(prisma.user.create).to.not.have.been.not.called;
    expect(prisma.workspaceMember.create).to.not.have.been.called;
  });

  it("should return an error if the inviter is not an admin", async function () {
    // Arrange
    const sendInvite = sandbox.stub();
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const identityConfig = {} as IdentityConfig;

    const call = {
      metadata,
      request: inviteRequest
    };

    const prisma = {
      user: {
        findUnique: sandbox.stub().resolves(),
        create: sandbox.stub().resolves({ ref: TEST_UUID })
      },
      workspaceMember: {
        create: sandbox.stub().resolves({ workspace: { name: workspaceName } }),
        findFirst: sandbox.stub().resolves()
      },
      workspace: {
        findUnique: sandbox.stub().resolves({
          ref: TEST_UUID,
          accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p",
          ownerRef: "another-user-id",
          members: []
        })
      }
    } as unknown as Prisma;

    const { createInviteUserToWorkspace } = await import(
      "../../src/workspaces/createInviteUserToWorkspace"
    );

    // Act
    const callback = sandbox.stub();
    await createInviteUserToWorkspace(
      prisma,
      identityConfig,
      sendInvite
    )(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWith({
      code: grpc.status.PERMISSION_DENIED,
      message: "Only admins or owners can invite users to a workspace"
    });
    expect(sendInvite).to.not.have.been.called;
    expect(prisma.user.create).to.not.have.been.not.called;
    expect(prisma.workspaceMember.create).to.not.have.been.called;
  });
});
