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
import { status } from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import * as sinon from "sinon";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { Prisma } from "../../src/db";
import { IdentityConfig } from "../../src/exchanges/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const AVATAR_URL = "https://example.com/avatar.jpg";

const openSignup = {
  auth: { methods: ["password"], signup: "open" }
} as unknown as IdentityConfig;

describe("@identity[users/createUser]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a user", async function () {
    // Arrange
    const call = {
      request: {
        name: "John Doe",
        email: "john@example.com",
        password: "12345678",
        avatar: AVATAR_URL
      }
    };

    const prisma = {
      user: {
        create: sandbox.stub().resolves({ ref: "123" })
      }
    } as unknown as Prisma;

    const { createCreateUser } = await import("../../src/users/createCreateUser");

    // Act
    await createCreateUser(prisma, openSignup)(call, (error, response) => {
      // Assert
      expect(response).to.deep.equal({ ref: "123" });
    });

    const { data } = (prisma.user.create as sinon.SinonStub).firstCall.args[0];
    expect(data.password).to.be.null;
    expect(data.passwordDigest).to.match(/^scrypt\$/);
  });

  it("refuses sign-up when it is invite-only", async function () {
    const create = sandbox.stub();
    const prisma = { user: { create } } as unknown as Prisma;
    const inviteOnly = {
      auth: { methods: ["password"], signup: "invite" }
    } as unknown as IdentityConfig;

    const { createCreateUser } = await import("../../src/users/createCreateUser");

    let error: unknown;
    await createCreateUser(prisma, inviteOnly)(
      {
        request: {
          name: "John Doe",
          email: "john@example.com",
          password: "12345678",
          avatar: AVATAR_URL
        }
      },
      (e) => {
        error = e;
      }
    );

    expect(error).to.deep.equal({
      code: status.PERMISSION_DENIED,
      message: "Sign-up is by invitation only"
    });
    expect(create).not.to.have.been.called;
  });

  it("should throw an error if user already exists", async function () {
    // Arrange
    const call = {
      request: {
        name: "John Doe",
        email: "john@example.com",
        password: "12345678",
        avatar: AVATAR_URL
      }
    };

    const prisma = {
      user: {
        create: sandbox.stub().throws({ code: "P2002" })
      }
    } as unknown as Prisma;

    const { createCreateUser } = await import("../../src/users/createCreateUser");

    // Act
    await createCreateUser(prisma, openSignup)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: status.ALREADY_EXISTS,
        message: "The resource already exists"
      });
    });
  });

  it("should throw if a validation error occurs", async function () {
    // Arrange
    const call = {
      request: {
        name: "John Doe",
        email: "malformed-email",
        password: "12345678",
        avatar: AVATAR_URL
      }
    };

    // Doesn't matter because it will not be called
    const prisma = {} as unknown as Prisma;

    const { createCreateUser } = await import("../../src/users/createCreateUser");

    // Act
    await createCreateUser(prisma, openSignup)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: status.INVALID_ARGUMENT,
        // eslint-disable-next-line prettier/prettier
        message: "Invalid email at \"email\""
      });
    });
  });
});
