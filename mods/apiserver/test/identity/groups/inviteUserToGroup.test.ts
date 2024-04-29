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
import { Prisma } from "../../../src/db";
import RoleEnum from "../../../src/identity/RoleEnum";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const TEST_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2lkZW50aXR5LWdsb2JhbC5mb25vc3Rlci5pbyIsInN1YiI6IjYzNWMwY2Q4LTgxMjUtNDgzZC1iNDY3LTA1YzUzY2UyY2QzMSIsImlhdCI6MTcxNDMyMjEwMi45MDgsInRva2VuVHlwZSI6ImFjY2VzcyIsImFjY2Vzc0tleUlkIjoiVVMxNHdqOHE2cWxpcnczMzFnZnN3dXNmYmxpZTZoNzh1eiIsInNjb3BlIjoiVVNFUiJ9.cgpRyb9a0NFzuQWGldIGXBlXTGBwXtXMvx_7uSWIVlq-_gRqZjQej2tm7O-RjXlly688Vu74nhUlowfhzj3DUPeXnwDkyHEK1wABFPWPwPfdSX29wntxnrDhd1KaO3JnEj6jwLEfN9EV--gXGygE1TdXLdYa-bxj26y_reZ1zT1guoNjJ9CaGJoM0rI2iv3TfxKANW6p27olFr4LBnonozyBGkkvuiyqXYzU8XKKWTVt1-pHMJlTqY0A203iPSc7CZUh6Y17fELlNwcY5O6gu3T3DXUbJBxkASGf0XXolwZcMcPeACpT2JEBIuxDTldDJMxeLVhunGSISC4ISH8-wA";

const groupName = "Test Group";
const groupOwner = "635c0cd8-8125-483d-b467-05c53ce2cd31";
const inviteRequest = {
  groupId: "1",
  email: "john@example.com",
  name: "John Doe",
  // Why ?
  role: RoleEnum.ADMIN as RoleEnum.ADMIN
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
      "../../../src/identity/groups/inviteUserToGroup"
    );

    // Act
    await inviteUserToGroup(prisma, sendInvite)(call, () => {});

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
      "../../../src/identity/groups/inviteUserToGroup"
    );

    // Act
    const callback = sandbox.stub();
    await inviteUserToGroup(prisma, sendInvite)(call, callback);

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
      "../../../src/identity/groups/inviteUserToGroup"
    );

    // Act
    const callback = sandbox.stub();
    await inviteUserToGroup(prisma, sendInvite)(call, callback);

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
