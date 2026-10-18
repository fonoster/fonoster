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
import { hashPassword } from "../../src/utils/passwords";
import { TEST_TOKEN, TEST_UUID } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@identity[users/updateUser]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should update a user", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: TEST_UUID,
        name: "John Doex"
      }
    };

    const prisma = {
      user: {
        update: sandbox.stub().resolves({ ref: TEST_UUID })
      }
    } as unknown as Prisma;

    const { createUpdateUser } = await import("../../src/users/createUpdateUser");

    // Act
    const response = await new Promise((resolve, reject) => {
      createUpdateUser(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response).to.deep.equal({ ref: TEST_UUID });
  });

  it("should throw an error if the user does not exist", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: TEST_UUID,
        name: "John Doex"
      }
    };

    const prisma = {
      user: {
        update: sandbox.stub().throws({ code: "P2025" })
      }
    } as unknown as Prisma;

    const { createUpdateUser } = await import("../../src/users/createUpdateUser");

    // Act
    const response = new Promise((resolve, reject) => {
      createUpdateUser(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    await expect(response).to.be.rejectedWith(
      "The requested resource was not found"
    );
  });

  describe("changing the password (M3)", function () {
    const callWith = (request: Record<string, unknown>) => {
      const metadata = new grpc.Metadata();
      metadata.set("token", TEST_TOKEN);
      return { metadata, request: { ref: TEST_UUID, ...request } };
    };

    async function prismaFor(stored: Record<string, unknown> | null) {
      const update = sandbox.stub().resolves({ ref: TEST_UUID });
      const revoke = sandbox.stub().resolves({ count: 1 });
      const prisma = {
        user: { findFirst: sandbox.stub().resolves(stored), update },
        refreshToken: { updateMany: revoke }
      } as unknown as Prisma;
      return { prisma, update, revoke };
    }

    async function run(prisma: Prisma, request: Record<string, unknown>) {
      const { createUpdateUser } = await import(
        "../../src/users/createUpdateUser"
      );
      return new Promise<{ error?: { code: number } | null }>((resolve) =>
        createUpdateUser(prisma)(callWith(request), (error) =>
          resolve({ error })
        )
      );
    }

    it("refuses a new password without the current one", async function () {
      const { prisma, update } = await prismaFor({
        ref: TEST_UUID,
        passwordDigest: await hashPassword("the-old-passw0rd")
      });

      const { error } = await run(prisma, { password: "a-new-passw0rd" });

      expect(error).to.include({ code: grpc.status.PERMISSION_DENIED });
      expect(update).not.to.have.been.called;
    });

    it("refuses a wrong current password", async function () {
      const { prisma, update } = await prismaFor({
        ref: TEST_UUID,
        passwordDigest: await hashPassword("the-old-passw0rd")
      });

      const { error } = await run(prisma, {
        password: "a-new-passw0rd",
        currentPassword: "not-the-old-one"
      });

      expect(error).to.include({ code: grpc.status.PERMISSION_DENIED });
      expect(update).not.to.have.been.called;
    });

    it("changes it with the current password and signs out everywhere", async function () {
      const { prisma, update, revoke } = await prismaFor({
        ref: TEST_UUID,
        accessKeyId: "USuser0001",
        passwordDigest: await hashPassword("the-old-passw0rd")
      });

      const { error } = await run(prisma, {
        password: "a-new-passw0rd",
        currentPassword: "the-old-passw0rd"
      });

      expect(error).to.be.null;
      expect(update.firstCall.args[0].data.passwordDigest).to.be.a("string");
      expect(revoke).to.have.been.calledOnce;
    });

    it("sends accounts without a password to the reset flow", async function () {
      const { prisma, update } = await prismaFor({
        ref: TEST_UUID,
        passwordDigest: null,
        password: null
      });

      const { error } = await run(prisma, {
        password: "a-new-passw0rd",
        currentPassword: ""
      });

      expect(error).to.include({ code: grpc.status.FAILED_PRECONDITION });
      expect(update).not.to.have.been.called;
    });

    it("leaves sessions alone when the password doesn't change", async function () {
      const { prisma, revoke } = await prismaFor(null);

      const { error } = await run(prisma, { name: "Ana" });

      expect(error).to.be.null;
      expect(revoke).not.to.have.been.called;
    });
  });
});
