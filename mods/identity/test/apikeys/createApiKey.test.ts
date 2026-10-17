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
import { Role } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { Prisma } from "../../src/db";
import { workspaceCallMetadata } from "../utils";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();
const WORKSPACE = "WOworkspace0001";

describe("@identity[apikeys/createApiKey]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a new ApiKey", async function () {
    // Arrange
    const metadata = workspaceCallMetadata(WORKSPACE, [
      { accessKeyId: WORKSPACE, role: Role.WORKSPACE_OWNER }
    ]);

    const expiresAtSeconds = Math.floor(Date.now() / 1000) + 3600;
    const call = {
      metadata,
      request: {
        workspaceRef: "123",
        role: Role.WORKSPACE_ADMIN,
        expiresAt: expiresAtSeconds
      }
    };

    const res = {
      ref: "123",
      accessKeyId: "accessKeyId",
      accessKeySecret: "accessKeySecret"
    };

    const createStub = sandbox.stub().resolves(res);
    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({ ref: "123" })
      },
      apiKey: {
        create: createStub
      }
    } as unknown as Prisma;

    const { createCreateApiKey } = await import("../../src/apikeys/createCreateApiKey");

    // Act
    await createCreateApiKey(prisma)(call, (_, response) => {
      // Assert
      expect(response).has.property("ref").to.be.equal("123");
      expect(response).has.property("accessKeyId").to.be.equal("accessKeyId");
      expect(response)
        .has.property("accessKeySecret")
        .to.be.equal("accessKeySecret");
    });

    // expiresAt is wire-format epoch seconds; it must be widened to
    // milliseconds before being stored as a Date.
    const storedExpiresAt = createStub.firstCall.args[0].data.expiresAt as Date;
    expect(storedExpiresAt.getTime()).to.be.equal(expiresAtSeconds * 1000);
  });

  it("should throw an error if the ApiKey already exists", async function () {
    // Arrange
    const metadata = workspaceCallMetadata(WORKSPACE, [
      { accessKeyId: WORKSPACE, role: Role.WORKSPACE_OWNER }
    ]);
    const call = {
      metadata,
      request: {
        workspaceRef: "123",
        role: Role.WORKSPACE_ADMIN,
        expiresAt: Math.floor(Date.now() / 1000) + 3600
      }
    };

    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({ ref: "123" })
      },
      apiKey: {
        create: sandbox.stub().throws({ code: "P2002" })
      }
    } as unknown as Prisma;

    const { createCreateApiKey } = await import("../../src/apikeys/createCreateApiKey");

    // Act
    await createCreateApiKey(prisma)(call, (error) => {
      // Assert
      expect(error).to.deep.equal({
        code: grpc.status.ALREADY_EXISTS,
        message: "The resource already exists"
      });
    });
  });
});

describe("@identity[apikeys/createApiKey] roles", function () {
  afterEach(() => sandbox.restore());

  const attempt = async (metadata: grpc.Metadata) => {
    const create = sandbox.stub().resolves({ ref: "k" });
    const prisma = {
      workspace: { findUnique: sandbox.stub().resolves({ ref: "123" }) },
      apiKey: { create }
    } as unknown as Prisma;
    const { createCreateApiKey } = await import("../../src/apikeys/createCreateApiKey");
    const error = await new Promise((resolve) =>
      createCreateApiKey(prisma)(
        { metadata, request: { role: Role.WORKSPACE_ADMIN } } as never,
        (e) => resolve(e)
      )
    );
    return { error, create };
  };

  it("doesn't let a workspace member mint an admin key", async function () {
    const { error, create } = await attempt(
      workspaceCallMetadata(WORKSPACE, [
        { accessKeyId: WORKSPACE, role: Role.WORKSPACE_MEMBER }
      ])
    );
    expect(error).to.include({ code: grpc.status.PERMISSION_DENIED });
    expect(create.called).to.be.false;
  });

  it("uses the role in the target workspace, not one held elsewhere", async function () {
    const { error, create } = await attempt(
      workspaceCallMetadata(WORKSPACE, [
        { accessKeyId: "WOotherworkspace", role: Role.WORKSPACE_OWNER },
        { accessKeyId: WORKSPACE, role: Role.WORKSPACE_MEMBER }
      ])
    );
    expect(error).to.include({ code: grpc.status.PERMISSION_DENIED });
    expect(create.called).to.be.false;
  });
});
