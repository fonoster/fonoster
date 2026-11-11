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
import { randomUUID } from "crypto";
import { expect } from "chai";
import { getWorld, Workspace, World } from "./world";

// identity "A deleted workspace's resources are deleted" (API-075 in
// mods/conformance/catalog/areas/api.md, #1321). A workspace deleted through the API leaves a
// deletion record in Identity's database. On its next tick, with no grace, the control plane's
// sweep deletes what the workspace left in the apiserver's database (applications with their
// vendor services, secrets with their provider keys, webhook endpoints and deliveries) and its
// numbers and trunks in Routr; Routr is a stand-in that holds each workspace's refs.

const PROVIDER = "openai";

describe("@api identity: a deleted workspace's apps, secrets, webhooks, numbers and trunks", function () {
  this.timeout(60_000);
  let world: World;

  before(async function () {
    world = await getWorld();
  });

  /** What a workspace keeps outside its call records, written straight to the apiserver's database. */
  async function seed(ws: Workspace, key: string) {
    const { prisma } = world.stack.apiDb;
    const accessKeyId = ws.accessKeyId;
    const product = `llm.api-075-${world.unique()}`;
    await prisma.product.create({
      data: { ref: product, name: "API-075", vendor: "OPENAI", type: "LLM" }
    });
    const app = await prisma.application.create({
      data: {
        accessKeyId,
        name: "Front desk",
        type: "AUTOPILOT",
        endpoint: "",
        intelligence: {
          create: { productRef: product, config: {}, credentials: key }
        }
      },
      include: { intelligence: true }
    });
    const secret = await prisma.secret.create({
      data: { accessKeyId, name: PROVIDER, secret: key }
    });
    await prisma.workspaceProviderKey.create({
      data: { accessKeyId, providerId: PROVIDER, secretRef: secret.ref }
    });
    const endpoint = `we_${randomUUID().replace(/-/g, "")}`;
    await prisma.webhookEndpoint.create({
      data: {
        ref: endpoint,
        accessKeyId,
        url: "https://hooks.acme.test/fonoster",
        events: ["call.ended"],
        secret: "whsec_test"
      }
    });
    await prisma.webhookDelivery.create({
      data: {
        ref: `wd_${randomUUID().replace(/-/g, "")}`,
        endpointRef: endpoint,
        accessKeyId,
        eventId: randomUUID(),
        eventType: "call.ended",
        event: { type: "call.ended", from: "+15550001111", to: "+15550002222" },
        status: "delivered",
        nextAttemptAt: new Date()
      }
    });
    return { intelligenceRef: app.intelligence.ref as string };
  }

  /** The workspace's rows, by table. */
  async function rows(ws: Workspace, intelligenceRef: string) {
    const { prisma } = world.stack.apiDb;
    const where = { accessKeyId: ws.accessKeyId };
    return {
      applications: await prisma.application.count({ where }),
      intelligence_services: await prisma.intelligence.count({
        where: { ref: intelligenceRef }
      }),
      secrets: await prisma.secret.count({ where }),
      workspace_provider_keys: await prisma.workspaceProviderKey.count({
        where
      }),
      webhook_endpoints: await prisma.webhookEndpoint.count({ where }),
      webhook_deliveries: await prisma.webhookDelivery.count({ where })
    };
  }

  it("[API-075] deletes them on the first sweep after the delete, and leaves a live workspace's", async function () {
    const { runWorkspaceErasure } =
      await import("../../../apiserver/src/records/maintenance");
    const { workspaceKey } =
      await import("../../../apiserver/src/regions/link");
    const { createWorkspaceDirectory } = await import("@fonoster/identity");
    const { prisma } = world.stack.apiDb;

    const owner = await world.signUp("Closing");
    const a = await world.createWorkspace(owner, `Gone ${world.unique()}`);
    const b = await world.createWorkspace(owner, `Stays ${world.unique()}`);
    const inA = await seed(a, "sk-a");
    const inB = await seed(b, "sk-b");
    const all = {
      applications: 1,
      intelligence_services: 1,
      secrets: 1,
      workspace_provider_keys: 1,
      webhook_endpoints: 1,
      webhook_deliveries: 1
    };
    expect(await rows(a, inA.intelligenceRef)).to.deep.equal(all);
    expect(await workspaceKey(prisma, a.accessKeyId, PROVIDER)).to.equal(
      "sk-a"
    );

    // Routr: each workspace's number and trunk, by ref.
    const routr = {
      numbers: { [a.accessKeyId]: ["nb-a"], [b.accessKeyId]: ["nb-b"] },
      trunks: { [a.accessKeyId]: ["tk-a"], [b.accessKeyId]: ["tk-b"] }
    };
    const remove = (byWorkspace: Record<string, string[]>) => {
      return async (ref: string) => {
        for (const key of Object.keys(byWorkspace))
          byWorkspace[key] = byWorkspace[key].filter((r) => r !== ref);
      };
    };
    const sip = {
      numbers: async (key: string) => routr.numbers[key] ?? [],
      trunks: async (key: string) => routr.trunks[key] ?? [],
      deleteNumber: remove(routr.numbers),
      deleteTrunk: remove(routr.trunks)
    };

    await world.raw.call(
      await world.as(owner, a),
      "Workspaces",
      "deleteWorkspace",
      { ref: a.ref }
    );

    // One tick of the sweep, as the apiserver's retention timer runs it. The workspace has no
    // call record, so no region is asked for anything.
    await runWorkspaceErasure(
      prisma as never,
      async () => {
        throw new Error("no call record to erase in this case");
      },
      createWorkspaceDirectory(world.stack.identityPrisma as never),
      undefined,
      sip
    );

    expect(await rows(a, inA.intelligenceRef)).to.deep.equal({
      applications: 0,
      intelligence_services: 0,
      secrets: 0,
      workspace_provider_keys: 0,
      webhook_endpoints: 0,
      webhook_deliveries: 0
    });
    expect(await workspaceKey(prisma, a.accessKeyId, PROVIDER)).to.equal(
      undefined
    );
    expect(routr).to.deep.equal({
      numbers: { [a.accessKeyId]: [], [b.accessKeyId]: ["nb-b"] },
      trunks: { [a.accessKeyId]: [], [b.accessKeyId]: ["tk-b"] }
    });
    expect(await rows(b, inB.intelligenceRef)).to.deep.equal(all);
    expect(await workspaceKey(prisma, b.accessKeyId, PROVIDER)).to.equal(
      "sk-b"
    );
  });
});
