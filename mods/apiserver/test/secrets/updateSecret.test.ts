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
import { Prisma } from "../../src/core/db";
import { TEST_TOKEN } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@secrets/updateSecret", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should update a secret", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: "123",
        name: "My new secret name",
        secret: "123456"
      }
    };

    const prisma = {
      secret: {
        update: sandbox.stub().resolves({ ref: "123" }),
        findUnique: sandbox
          .stub()
          .resolves({ accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p" })
      }
    } as unknown as Prisma;

    const { updateSecret } = await import("../../src/secrets/updateSecret");

    // Act
    const response = await new Promise((resolve, reject) => {
      updateSecret(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    expect(response).to.deep.equal({ ref: "123" });
  });

  it("should throw an error if the secret does not exist", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: "123",
        name: "My new secret name",
        secret: "123456"
      }
    };

    const prisma = {
      secret: {
        update: sandbox.stub().throws({ code: "P2025" }),
        findUnique: sandbox.stub().resolves(null)
      }
    } as unknown as Prisma;

    const { updateSecret } = await import("../../src/secrets/updateSecret");

    // Act
    const response = new Promise((resolve, reject) => {
      updateSecret(prisma)(call, (error, response) => {
        if (error) return reject(error);
        resolve(response);
      });
    });

    // Assert
    await expect(response).to.be.rejectedWith(
      `The requested resource was not found`
    );
  });
});
