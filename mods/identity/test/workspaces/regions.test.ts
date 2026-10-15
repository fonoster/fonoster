/**
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
import { expect } from "chai";
import { createSandbox } from "sinon";
import { Prisma } from "../../src/db";
import { WorkspaceRegionHooks } from "../../src/exchanges/types";
import { TEST_TOKEN } from "../utils";

const sandbox = createSandbox();

function call(request: Record<string, unknown>) {
  const metadata = new grpc.Metadata();
  metadata.set("token", TEST_TOKEN);
  return { metadata, request };
}

function run<T>(
  handler: (call: never, cb: (e: unknown, r?: T) => void) => unknown,
  request: Record<string, unknown>
) {
  return new Promise<{ error: unknown; response?: T }>((resolve) => {
    void handler(call(request) as never, (error, response) =>
      resolve({ error, response })
    );
  });
}

function hooks(): WorkspaceRegionHooks & {
  createPrivateRegion: sinon.SinonStub;
  deleteRegion: sinon.SinonStub;
} {
  return {
    publicRegions: ["us-east-1"],
    defaultRegion: "us-east-1",
    createPrivateRegion: sandbox.stub().resolves({
      regionRef: "rg_abcdefghijklmnop",
      enrollmentToken: "eyJ.token",
      expiresAt: "2026-10-16T12:00:00.000Z"
    }),
    deleteRegion: sandbox.stub().resolves()
  } as never;
}

describe("@identity[workspaces/regions] (add-private-regions)", function () {
  afterEach(() => sandbox.restore());

  it("binds a new workspace to the default public region", async function () {
    const create = sandbox.stub().resolves({ ref: "w1" });
    const prisma = { workspace: { create } } as unknown as Prisma;
    const { createCreateWorkspace } =
      await import("../../src/workspaces/createCreateWorkspace");
    const { response } = await run(createCreateWorkspace(prisma, hooks()), {
      name: "Acme"
    });
    expect(response).to.deep.equal({ ref: "w1", region: "us-east-1" });
    expect(create.firstCall.args[0].data.region).to.equal("us-east-1");
  });

  it("creates the private region with the workspace and returns the token once", async function () {
    const create = sandbox.stub().resolves({ ref: "w2" });
    const prisma = { workspace: { create } } as unknown as Prisma;
    const h = hooks();
    const { createCreateWorkspace } =
      await import("../../src/workspaces/createCreateWorkspace");
    const { response } = await run(createCreateWorkspace(prisma, h), {
      name: "Acme on-prem",
      region: "private"
    });
    expect(response).to.deep.equal({
      ref: "w2",
      region: "rg_abcdefghijklmnop",
      enrollmentToken: "eyJ.token",
      expiresAt: "2026-10-16T12:00:00.000Z"
    });
    const accessKeyId = create.firstCall.args[0].data.accessKeyId;
    expect(h.createPrivateRegion).to.have.been.calledWith({ accessKeyId });
    expect(create.firstCall.args[0].data.region).to.equal(
      "rg_abcdefghijklmnop"
    );
  });

  it("refuses an unknown region and private without the control plane", async function () {
    const prisma = {
      workspace: { create: sandbox.stub() }
    } as unknown as Prisma;
    const { createCreateWorkspace } =
      await import("../../src/workspaces/createCreateWorkspace");
    const bad = await run(createCreateWorkspace(prisma, hooks()), {
      name: "Acme",
      region: "eu-west-9"
    });
    expect(bad.error).to.include({ code: grpc.status.INVALID_ARGUMENT });
    const none = await run(createCreateWorkspace(prisma), {
      name: "Acme",
      region: "private"
    });
    expect(none.error).to.include({ code: grpc.status.FAILED_PRECONDITION });
  });

  it("retires the region when the workspace row cannot be created", async function () {
    const prisma = {
      workspace: { create: sandbox.stub().rejects(new Error("db down")) }
    } as unknown as Prisma;
    const h = hooks();
    const { createCreateWorkspace } =
      await import("../../src/workspaces/createCreateWorkspace");
    await run(createCreateWorkspace(prisma, h), {
      name: "Acme",
      region: "private"
    });
    expect(h.deleteRegion).to.have.been.calledOnce;
  });

  it("refuses a region change with region_immutable", async function () {
    const update = sandbox.stub().resolves({});
    const { getUserRefFromToken } =
      await import("../../src/utils/getUserRefFromToken");
    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({
          ref: "w1",
          region: "us-east-1",
          ownerRef: getUserRefFromToken(TEST_TOKEN),
          members: []
        }),
        update
      }
    } as unknown as Prisma;
    const { createUpdateWorkspace } =
      await import("../../src/workspaces/createUpdateWorkspace");
    const { error } = await run(createUpdateWorkspace(prisma), {
      ref: "123e4567-e89b-12d3-a456-426614174000",
      region: "rg_other0000000000"
    });
    expect(String((error as { message: string }).message)).to.contain(
      "region_immutable"
    );
    expect(update).not.to.have.been.called;
  });

  it("deleting a private workspace retires its region", async function () {
    const prisma = {
      workspace: {
        delete: sandbox
          .stub()
          .resolves({
            ref: "w2",
            accessKeyId: "WOacme",
            region: "rg_abcdefghijklmnop"
          })
      }
    } as unknown as Prisma;
    const h = hooks();
    const { createDeleteWorkspace } =
      await import("../../src/workspaces/createDeleteWorkspace");
    await run(createDeleteWorkspace(prisma, h), {
      ref: "123e4567-e89b-12d3-a456-426614174000"
    });
    expect(h.deleteRegion).to.have.been.calledWith({ accessKeyId: "WOacme" });
  });
});
