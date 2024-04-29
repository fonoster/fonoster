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

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const TEST_TOKEN =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2lkZW50aXR5LWdsb2JhbC5mb25vc3Rlci5pbyIsInN1YiI6IjYzNWMwY2Q4LTgxMjUtNDgzZC1iNDY3LTA1YzUzY2UyY2QzMSIsImlhdCI6MTcxNDMyMjEwMi45MDgsInRva2VuVHlwZSI6ImFjY2VzcyIsImFjY2Vzc0tleUlkIjoiVVMxNHdqOHE2cWxpcnczMzFnZnN3dXNmYmxpZTZoNzh1eiIsInNjb3BlIjoiVVNFUiJ9.cgpRyb9a0NFzuQWGldIGXBlXTGBwXtXMvx_7uSWIVlq-_gRqZjQej2tm7O-RjXlly688Vu74nhUlowfhzj3DUPeXnwDkyHEK1wABFPWPwPfdSX29wntxnrDhd1KaO3JnEj6jwLEfN9EV--gXGygE1TdXLdYa-bxj26y_reZ1zT1guoNjJ9CaGJoM0rI2iv3TfxKANW6p27olFr4LBnonozyBGkkvuiyqXYzU8XKKWTVt1-pHMJlTqY0A203iPSc7CZUh6Y17fELlNwcY5O6gu3T3DXUbJBxkASGf0XXolwZcMcPeACpT2JEBIuxDTldDJMxeLVhunGSISC4ISH8-wA";

describe("@apiserver[identity/group/resendGroupMembershipInvitation]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should resend a group membership invitation", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const userId = "635c0cd8-8125-483d-b467-05c53ce2cd31";

    const call = {
      metadata,
      request: {
        groupId: "123",
        userId
      }
    };

    const prisma = {
      group: {
        findUnique: sandbox.stub().resolves({
          ownerId: userId,
          members: [
            {
              userId,
              role: "ADMIN"
            }
          ]
        })
      },
      groupMember: {
        findFirst: sandbox.stub().resolves({
          user: {
            email: "john@example.com",
            password: "123456"
          },
          group: {
            name: "Test Group"
          }
        })
      }
    } as unknown as Prisma;

    const sendInvite = sandbox.stub().resolves();

    // Act
    const { resendGroupMembershipInvitation } = await import(
      "../../../src/identity/groups/resendGroupMembershipInvitation"
    );

    const callback = sandbox.stub();

    await resendGroupMembershipInvitation(prisma, sendInvite)(call, callback);

    // Assert
    expect(callback).to.have.been.calledOnceWith(null, {
      groupId: "123",
      userId
    });
  });

  it("should return PERMISSION_DENIED if user is not an admin", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);
    const userId = "635c0cd8-8125-483d-b467-05c53ce2cd31";

    const call = {
      metadata,
      request: {
        groupId: "123",
        userId
      }
    };

    const prisma = {
      group: {
        findUnique: sandbox.stub().resolves({
          ownerId: "another-user",
          members: [
            {
              userId,
              role: "USER"
            }
          ]
        })
      }
    } as unknown as Prisma;

    const sendInvite = sandbox.stub().resolves();

    // Act
    const { resendGroupMembershipInvitation } = await import(
      "../../../src/identity/groups/resendGroupMembershipInvitation"
    );

    const callback = sandbox.stub();

    await resendGroupMembershipInvitation(prisma, sendInvite)(call, callback);

    resendGroupMembershipInvitation(prisma, sendInvite)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.PERMISSION_DENIED,
        message: "Only admins or owners can remove users from a group"
      });
    });
  });
});
