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
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJ0b2tlblR5cGUiOiJhY2Nlc3MiLCJzY29wZSI6InVzZXIifQ.oYI1CplgA-okuQtUxm-3q0zsZdNptW8z1I6pOBJ5uaXMCLcpALs5Jr32jq-Fl2Y5u5GAtgM9RM3YiEThP__UNOwm0roCx1-V3aJkT_eoRHT4DCDPNF1TxvQN2jyIuVQKaVbgimrWJ8l_jsBXPZJ7qLBt7ZWYucxusARhLv82t-_YBizg6595Q0_pdRQOO0_h_H1TjwoQkLB726aXdfPQuUK11rFGWjUtEFg-GaeiVkln625AL74aHZO18jJNuOe9ViQWPjIf9dODRYBn9fmSko6yKMf2Ql94aV--gVJ-PCIZMYC23s-bO0hhwvvJtYTAqPCRO7UCUUD68mkhtx6haA";

describe("@apiserver[identity/groups/getGroupById]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should get a group by id", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        id: "123"
      }
    };

    const group = {
      id: "123",
      name: "My Group",
      ownerId: "123",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const prisma = {
      group: {
        findUnique: sandbox.stub().resolves(group)
      }
    } as unknown as Prisma;

    const { getGroupById } = await import(
      "../../../src/identity/groups/getGroupById"
    );

    // Act
    const response = await new Promise((resolve, reject) => {
      getGroupById(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response).to.deep.equal(group);
  });

  it("should throw an error if group not found", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        id: "123"
      }
    };

    const prisma = {
      group: {
        findUnique: sandbox.stub().resolves(null)
      }
    } as unknown as Prisma;

    const { getGroupById } = await import(
      "../../../src/identity/groups/getGroupById"
    );

    // Act
    await getGroupById(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.NOT_FOUND,
        message: "Group not found"
      });
    });
  });
});
