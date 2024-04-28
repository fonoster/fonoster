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

describe("@apiserver[identity/group/updateGroup]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should update a group", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        id: "123",
        name: "My Groupx"
      }
    };

    const prisma = {
      group: {
        update: sandbox.stub().resolves({ id: "123" }),
        findUnique: sandbox.stub().resolves({ ownerId: "123" })
      },
      groupMember: {
        findFirst: sandbox.stub().resolves({})
      }
    } as unknown as Prisma;

    const { updateGroup } = await import(
      "../../../src/identity/groups/updateGroup"
    );

    // Act
    const response = await new Promise((resolve, reject) => {
      updateGroup(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response).to.deep.equal({ id: "123" });
  });

  it("should throw an error if the user does not exist", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        id: "123",
        name: "John Doex"
      }
    };

    const prisma = {
      user: {
        update: sandbox.stub().throws({ code: "P2025" })
      }
    } as unknown as Prisma;

    const { updateUser } = await import(
      "../../../src/identity/users/updateUser"
    );

    // Act
    const response = new Promise((resolve, reject) => {
      updateUser(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    await expect(response).to.be.rejectedWith(
      "The requested resource was not found"
    );
  });
});
