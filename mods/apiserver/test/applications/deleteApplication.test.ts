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
import { TEST_TOKEN } from "../testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@applications/deleteApplication", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should delete an application", async function () {
    // Arrange
    const metadata = new grpc.Metadata();
    metadata.set("token", TEST_TOKEN);

    const call = {
      metadata,
      request: {
        ref: "123"
      }
    };

    const res = {
      ref: "123"
    };

    const prisma = {
      application: {
        delete: sandbox.stub().resolves(res),
        findUnique: sandbox.stub().resolves({
          accessKeyId: "GRahn02s8tgdfghz72vb0fz538qpb5z35p"
        })
      }
    } as unknown as Prisma;

    const { deleteApplication } = await import(
      "../../src/applications/deleteApplication"
    );

    // Act
    await deleteApplication(prisma)(call, (_, response) => {
      // Assert
      expect(response).to.have.property("ref", "123");
    });
  });
});
