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
import * as sinon from "sinon";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { Prisma } from "../../src/db";
import { TEST_TOKEN } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@identity[users/deleteUser]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should delete a user by id", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const prisma = {
      user: {
        findUnique: sandbox.stub().resolves({ ref: "123" }),
        delete: sandbox.stub().resolves()
      }
    } as unknown as Prisma;

    const { createDeleteUser } =
      await import("../../src/users/createDeleteUser");

    // Act
    const response = await new Promise((resolve, reject) => {
      createDeleteUser(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response).to.deep.equal({ ref: "123" });
  });

  it("should throw an error if user not found", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const prisma = {
      user: {
        findUnique: sandbox.stub().resolves(null),
        delete: sandbox.stub().throws({ code: "P2025" })
      }
    } as unknown as Prisma;

    const { createDeleteUser } =
      await import("../../src/users/createDeleteUser");

    // Act
    await createDeleteUser(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.NOT_FOUND,
        message: "The requested resource was not found"
      });
    });
  });

  describe("with billing (Fonoster Cloud)", function () {
    const call = () => {
      const metadata = new grpc.Metadata();
      metadata.set("token", TEST_TOKEN);
      return { metadata, request: { ref: "123" } };
    };

    const prismaWith = (user: object | null) =>
      ({
        user: {
          findUnique: sandbox.stub().resolves(user),
          delete: sandbox.stub().resolves()
        }
      }) as unknown as Prisma & {
        user: { findUnique: sinon.SinonStub; delete: sinon.SinonStub };
      };

    const run = async (prisma: Prisma, billing: object) => {
      const { createDeleteUser } =
        await import("../../src/users/createDeleteUser");
      return new Promise<{ error?: unknown; response?: unknown }>((resolve) =>
        createDeleteUser(prisma, billing as never)(call(), (error, response) =>
          resolve({ error, response })
        )
      );
    };

    it("closes the user's billing account before deleting the user", async function () {
      // Arrange
      const prisma = prismaWith({ ref: "123" });
      const billing = { closeAccount: sandbox.stub().resolves() };

      // Act
      const { error, response } = await run(prisma, billing);

      // Assert
      expect(error).to.not.exist;
      expect(response).to.deep.equal({ ref: "123" });
      expect(billing.closeAccount).to.have.been.calledOnceWith("123");
      expect(billing.closeAccount).to.have.been.calledBefore(
        prisma.user.delete
      );
    });

    it("refuses with billing's message while the user has a balance due", async function () {
      // Arrange
      const prisma = prismaWith({ ref: "123" });
      const message =
        "the user has a balance due: pay it under Billing, then delete the user";
      const billing = {
        closeAccount: sandbox
          .stub()
          .rejects({ code: grpc.status.FAILED_PRECONDITION, message })
      };

      // Act
      const { error } = await run(prisma, billing);

      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.FAILED_PRECONDITION,
        message
      });
      expect(prisma.user.delete).to.not.have.been.called;
    });

    it("refuses with UNAVAILABLE when billing can't be asked", async function () {
      // Arrange
      const prisma = prismaWith({ ref: "123" });
      const billing = {
        closeAccount: sandbox
          .stub()
          .rejects({ code: grpc.status.DEADLINE_EXCEEDED, message: "late" })
      };

      // Act
      const { error } = await run(prisma, billing);

      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.UNAVAILABLE,
        message: "couldn't check the user's billing; try again"
      });
      expect(prisma.user.delete).to.not.have.been.called;
    });

    it("doesn't close an account for a ref that isn't the caller's user", async function () {
      // Arrange
      const prisma = prismaWith(null);
      const billing = { closeAccount: sandbox.stub().resolves() };

      // Act
      const { error } = await run(prisma, billing);

      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.NOT_FOUND,
        message: "The requested resource was not found"
      });
      expect(billing.closeAccount).to.not.have.been.called;
      expect(prisma.user.delete).to.not.have.been.called;
    });
  });
});
