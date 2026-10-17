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
import { Role } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import { createSandbox, SinonStub } from "sinon";
import { Prisma } from "../../src/db";
import { workspaceCallMetadata } from "../utils";

const sandbox = createSandbox();

const WORKSPACE_A = "WOworkspaceA001";
const WORKSPACE_B = "WOworkspaceB001";

/** Calls a handler and resolves with what it passed to the callback. */
function invoke(handler: Function, call: unknown) {
  return new Promise<{ error?: unknown; response?: unknown }>((resolve) =>
    handler(call, (error: unknown, response: unknown) =>
      resolve({ error, response })
    )
  );
}

const fakePrisma = (key: unknown) =>
  ({
    apiKey: {
      findFirst: sandbox.stub().resolves(key),
      delete: sandbox.stub().resolves(key),
      update: sandbox
        .stub()
        .resolves({ ...(key as object), accessKeySecret: "new-secret" })
    },
    refreshToken: { updateMany: sandbox.stub().resolves({ count: 0 }) }
  }) as unknown as Prisma & {
    apiKey: Record<string, SinonStub>;
    refreshToken: Record<string, SinonStub>;
  };

const KEY = { ref: "key-1", accessKeyId: "APkey0001" };

const handlers = async () => ({
  delete: (await import("../../src/apikeys/createDeleteApiKey"))
    .createDeleteApiKey,
  regenerate: (await import("../../src/apikeys/createRegenerateApiKey"))
    .createRegenerateApiKey
});

describe("@identity[apikeys/deleteApiKey and regenerateApiKey]", function () {
  afterEach(() => sandbox.restore());

  (["delete", "regenerate"] as const).forEach((name) => {
    describe(name, function () {
      it("acts on a key of the caller's workspace and ends its sessions", async function () {
        const prisma = fakePrisma(KEY);
        const handler = (await handlers())[name](prisma);
        const metadata = workspaceCallMetadata(WORKSPACE_A, [
          { accessKeyId: WORKSPACE_A, role: Role.WORKSPACE_ADMIN }
        ]);

        const { error, response } = await invoke(handler, {
          metadata,
          request: { ref: KEY.ref }
        });

        expect(error).to.be.null;
        expect(response).to.have.property("ref", KEY.ref);
        expect(prisma.apiKey.findFirst.firstCall.args[0]).to.deep.equal({
          where: { ref: KEY.ref, workspace: { accessKeyId: WORKSPACE_A } }
        });
        expect(prisma.refreshToken.updateMany.firstCall.args[0].where).to.include({
          accessKeyId: KEY.accessKeyId
        });
      });

      it("answers NOT_FOUND for another workspace's key and changes nothing", async function () {
        const prisma = fakePrisma(null);
        const handler = (await handlers())[name](prisma);
        const metadata = workspaceCallMetadata(WORKSPACE_A, [
          { accessKeyId: WORKSPACE_A, role: Role.WORKSPACE_OWNER }
        ]);

        const { error } = await invoke(handler, {
          metadata,
          request: { ref: "key-of-workspace-b" }
        });

        expect(error).to.include({ code: grpc.status.NOT_FOUND });
        expect(prisma.apiKey.delete.called).to.be.false;
        expect(prisma.apiKey.update.called).to.be.false;
      });

      it("refuses a workspace member", async function () {
        const prisma = fakePrisma(KEY);
        const handler = (await handlers())[name](prisma);
        const metadata = workspaceCallMetadata(WORKSPACE_A, [
          { accessKeyId: WORKSPACE_A, role: Role.WORKSPACE_MEMBER }
        ]);

        const { error } = await invoke(handler, {
          metadata,
          request: { ref: KEY.ref }
        });

        expect(error).to.include({ code: grpc.status.PERMISSION_DENIED });
        expect(prisma.apiKey.findFirst.called).to.be.false;
      });

      it("refuses the owner of A acting in B, where they are a member", async function () {
        const prisma = fakePrisma(KEY);
        const handler = (await handlers())[name](prisma);
        const metadata = workspaceCallMetadata(WORKSPACE_B, [
          { accessKeyId: WORKSPACE_A, role: Role.WORKSPACE_OWNER },
          { accessKeyId: WORKSPACE_B, role: Role.WORKSPACE_MEMBER }
        ]);

        const { error } = await invoke(handler, {
          metadata,
          request: { ref: KEY.ref }
        });

        expect(error).to.include({ code: grpc.status.PERMISSION_DENIED });
        expect(prisma.apiKey.findFirst.called).to.be.false;
      });
    });
  });
});
