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
});
