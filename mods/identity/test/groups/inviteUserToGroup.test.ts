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
import { Prisma } from "../../src/db";
import { IdentityConfig } from "../../src/exchanges/types";
import { GroupRoleEnum } from "../../src/groups/GroupRoleEnum";
import { TEST_TOKEN } from "../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const groupName = "Test Group";
const groupOwner = "635c0cd8-8125-483d-b467-05c53ce2cd31";
const inviteRequest = {
  groupId: "1",
  email: "john@example.com",
  name: "John Doe",
  // Why ?
  role: GroupRoleEnum.ADMIN as GroupRoleEnum.ADMIN
};

describe("@apiserver[identity/group/inviteUserToGroup]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should invite a user to a group", async function () {
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
      }
    } as IdentityConfig;

    const prisma = {
      user: {
        findUnique: sandbox.stub().resolves(),
        create: sandbox.stub().resolves({ id: "123" })
      },
      groupMember: {
        create: sandbox.stub().resolves({ group: { name: groupName } }),
        findFirst: sandbox.stub().resolves()
      },
      group: {
        findUnique: sandbox.stub().resolves({
          ownerId: groupOwner,
          members: []
        })
      }
    } as unknown as Prisma;

    const { inviteUserToGroup } = await import(
      "../../src/groups/inviteUserToGroup"
    );

    // Act
    await inviteUserToGroup(prisma, identityConfig, sendInvite)(call, () => {});

    // Assert
    expect(sendInvite).to.have.been.calledOnce;
    expect(prisma.user.create).to.have.been.calledOnce;
    expect(prisma.groupMember.create).to.have.been.calledOnce;
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
      }
    } as IdentityConfig;

    const prisma = {
      user: {
        findUnique: sandbox.stub().resolves({ id: "123" }),
        create: sandbox.stub().resolves()
      },
      groupMember: {
        create: sandbox.stub().resolves({ group: { name: groupName } }),
        findFirst: sandbox.stub().resolves({ id: "123" })
      },
      group: {
        findUnique: sandbox.stub().resolves({
          ownerId: groupOwner,
          members: []
        })
      }
    } as unknown as Prisma;

    const { inviteUserToGroup } = await import(
      "../../src/groups/inviteUserToGroup"
    );

    // Act
    const callback = sandbox.stub();
    await inviteUserToGroup(prisma, identityConfig, sendInvite)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWith({
      code: grpc.status.ALREADY_EXISTS,
      message: "User is already a member of this group"
    });
    expect(sendInvite).to.not.have.been.called;
    expect(prisma.user.create).to.not.have.been.not.called;
    expect(prisma.groupMember.create).to.not.have.been.called;
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
        create: sandbox.stub().resolves({ id: "123" })
      },
      groupMember: {
        create: sandbox.stub().resolves({ group: { name: groupName } }),
        findFirst: sandbox.stub().resolves()
      },
      group: {
        findUnique: sandbox.stub().resolves({
          ownerId: "another-user-id",
          members: []
        })
      }
    } as unknown as Prisma;

    const { inviteUserToGroup } = await import(
      "../../src/groups/inviteUserToGroup"
    );

    // Act
    const callback = sandbox.stub();
    await inviteUserToGroup(prisma, identityConfig, sendInvite)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWith({
      code: grpc.status.PERMISSION_DENIED,
      message: "Only admins or owners can invite users to a group"
    });
    expect(sendInvite).to.not.have.been.called;
    expect(prisma.user.create).to.not.have.been.not.called;
    expect(prisma.groupMember.create).to.not.have.been.called;
  });
});
