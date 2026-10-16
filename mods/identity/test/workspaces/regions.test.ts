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
  resolveRegion: sinon.SinonStub;
  workspaceChanged: sinon.SinonStub;
} {
  return {
    publicRegions: ["default"],
    defaultRegion: "default",
    resolveRegion: sandbox
      .stub()
      .callsFake(async (_owner: string, requested?: string) => {
        if (!requested || requested === "default") return { region: "default" };
        if (requested === "acme-hq") return { region: "rg_abcdefghijklmnop" };
        throw new Error("region must be one of default or one of yours");
      }),
    workspaceChanged: sandbox.stub()
  } as never;
}

describe("@identity[workspaces/regions] (add-private-regions)", function () {
  afterEach(() => sandbox.restore());

  it("binds a new workspace to the default public region", async function () {
    const create = sandbox.stub().resolves({ ref: "w1" });
    const prisma = { workspace: { create } } as unknown as Prisma;
    const h = hooks();
    const { createCreateWorkspace } =
      await import("../../src/workspaces/createCreateWorkspace");
    const { response } = await run(createCreateWorkspace(prisma, h), {
      name: "Acme"
    });
    expect(response).to.deep.equal({ ref: "w1", region: "default" });
    expect(create.firstCall.args[0].data.region).to.equal("default");
    expect(h.workspaceChanged).to.have.been.calledWithMatch({
      region: "default"
    });
  });

  it("binds a workspace to one of the caller's private regions (stored as its ref)", async function () {
    const create = sandbox.stub().resolves({ ref: "w2" });
    const prisma = { workspace: { create } } as unknown as Prisma;
    const h = hooks();
    const { createCreateWorkspace } =
      await import("../../src/workspaces/createCreateWorkspace");
    const { getUserRefFromToken } =
      await import("../../src/utils/getUserRefFromToken");
    const { response } = await run(createCreateWorkspace(prisma, h), {
      name: "Acme on-prem",
      region: "acme-hq"
    });
    expect(response).to.deep.equal({
      ref: "w2",
      region: "rg_abcdefghijklmnop"
    });
    expect(h.resolveRegion).to.have.been.calledWith(
      getUserRefFromToken(TEST_TOKEN),
      "acme-hq"
    );
    expect(create.firstCall.args[0].data.region).to.equal(
      "rg_abcdefghijklmnop"
    );
    expect(h.workspaceChanged).to.have.been.calledWithMatch({
      region: "rg_abcdefghijklmnop"
    });
  });

  it("refuses a region the caller cannot pick, and anything but default without the control plane", async function () {
    const create = sandbox.stub();
    const prisma = { workspace: { create } } as unknown as Prisma;
    const { createCreateWorkspace } =
      await import("../../src/workspaces/createCreateWorkspace");
    const bad = await run(createCreateWorkspace(prisma, hooks()), {
      name: "Acme",
      region: "someone-elses"
    });
    expect(bad.error).to.include({ code: grpc.status.INVALID_ARGUMENT });
    const none = await run(createCreateWorkspace(prisma), {
      name: "Acme",
      region: "private"
    });
    expect(none.error).to.include({ code: grpc.status.INVALID_ARGUMENT });
    expect(create).not.to.have.been.called;
  });

  it("refuses a region change with region_immutable", async function () {
    const update = sandbox.stub().resolves({});
    const { getUserRefFromToken } =
      await import("../../src/utils/getUserRefFromToken");
    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves({
          ref: "w1",
          region: "default",
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

  it("deleting a workspace leaves its region and resyncs it", async function () {
    const prisma = {
      workspace: {
        delete: sandbox.stub().resolves({
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
    expect(h.workspaceChanged).to.have.been.calledWith({
      accessKeyId: "WOacme",
      region: "rg_abcdefghijklmnop"
    });
  });

  it("the workspace directory reads workspaces by key and by region", async function () {
    const row = {
      ref: "w1",
      accessKeyId: "WOacme",
      name: "Acme",
      ownerRef: "u1",
      region: "default",
      createdAt: new Date()
    };
    const prisma = {
      workspace: {
        findUnique: sandbox.stub().resolves(row),
        findMany: sandbox.stub().resolves([row])
      }
    } as unknown as Prisma;
    const { createWorkspaceDirectory } =
      await import("../../src/workspaces/createWorkspaceDirectory");
    const dir = createWorkspaceDirectory(prisma);
    const expected = {
      ref: "w1",
      accessKeyId: "WOacme",
      name: "Acme",
      ownerRef: "u1",
      region: "default"
    };
    expect(await dir.workspace("WOacme")).to.deep.equal(expected);
    expect(await dir.inRegion("default")).to.deep.equal([expected]);
  });
});
