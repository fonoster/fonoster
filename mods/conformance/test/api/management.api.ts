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
/* eslint-disable mocha/no-setup-in-describe */
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import { codeOf, Driver, Who } from "./drivers";
import { Request, Resource, RESOURCES } from "./resources";
import { getWorld, World } from "./world";

// management-api: the shared contract of every workspace resource, through both clients
// (API-001 to API-010 in mods/conformance/catalog/areas/api.md).

type Item = { ref: string } & Record<string, unknown>;

const UNKNOWN_REF = "00000000-0000-4000-8000-000000000000";

function ops(d: Driver, who: Who, r: Resource) {
  return {
    create: (req: Request) => d.call<{ ref: string }>(who, r.api, `create${r.noun}`, req),
    get: (ref: string) => d.call<Item>(who, r.api, `get${r.noun}`, { ref }),
    update: (req: Request) => d.call(who, r.api, `update${r.noun}`, req),
    remove: (ref: string) => d.call(who, r.api, `delete${r.noun}`, { ref }),
    list: (req: Request = {}) =>
      d.call<{ items: Item[]; nextPageToken?: string }>(who, r.api, r.list, req)
  };
}

/** Every item of the workspace, walking the pages. */
async function listAll(d: Driver, who: Who, r: Resource, pageSize = 100) {
  const items: Item[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 100; page++) {
    const res = await ops(d, who, r).list({ pageSize, ...(pageToken ? { pageToken } : {}) });
    expect(res.items.length, "page size").to.be.at.most(pageSize);
    items.push(...res.items);
    if (!res.nextPageToken) return items;
    pageToken = res.nextPageToken;
  }
  throw new Error("more than 100 pages");
}

const refs = (items: Item[]) => items.map((i) => i.ref);

describe("@api management-api", function () {
  this.timeout(60_000);
  let world: World;
  let a: Who;
  let b: Who;

  before(async function () {
    world = await getWorld();
    a = await world.as(world.ownerA, world.wsA);
    b = await world.as(world.ownerB, world.wsB);
  });

  for (const driverName of ["sdk", "grpc"] as const) {
    describe(driverName, function () {
      const driver = () => world.drivers.find((d) => d.name === driverName)!;

      for (const r of RESOURCES) {
        describe(r.api, function () {
          it(`[API-001] (${driverName}) ${r.api}: a created resource comes back from get and list`, async function () {
            const o = ops(driver(), a, r);
            const req = r.create(world.unique());
            const { ref } = await o.create(req);

            expect(ref).to.be.a("string").and.not.empty;
            if (r.get) expect((await o.get(ref))[r.echo]).to.equal(req[r.echo]);
            const listed = (await listAll(driver(), a, r)).find((i) => i.ref === ref);
            expect(listed, "in the list").to.exist;
            expect(listed![r.echo]).to.equal(req[r.echo]);
          });

          if (r.update)
            it(`[API-002] (${driverName}) ${r.api}: an update is kept and the other fields are unchanged`, async function () {
              const o = ops(driver(), a, r);
              const req = r.create(world.unique());
              const { ref } = await o.create(req);
              const change = r.update!(ref, world.unique());

              await o.update(change);

              const after = await o.get(ref);
              expect(after[r.updated!]).to.equal(change[r.updated!]);
              if (r.echo !== r.updated) expect(after[r.echo]).to.equal(req[r.echo]);
            });

          it(`[API-003] (${driverName}) ${r.api}: a create missing ${r.missing.field} fails with INVALID_ARGUMENT naming it and creates nothing`, async function () {
            const before = refs(await listAll(driver(), a, r));

            const error = await ops(driver(), a, r)
              .create(r.missing.request(world.unique()))
              .then(() => undefined, (e) => e);

            expect(error, "the create failed").to.exist;
            expect(error.code).to.equal(status.INVALID_ARGUMENT);
            expect(error.details ?? error.message).to.match(new RegExp(r.missing.field, "i"));
            expect(refs(await listAll(driver(), a, r))).to.have.members(before);
          });

          it(`[API-004] (${driverName}) ${r.api}: a malformed ${r.malformed.field} fails with INVALID_ARGUMENT naming it and creates nothing`, async function () {
            const before = refs(await listAll(driver(), a, r));

            const error = await ops(driver(), a, r)
              .create(r.malformed.request(world.unique()))
              .then(() => undefined, (e) => e);

            expect(error, "the create failed").to.exist;
            expect(error.code).to.equal(status.INVALID_ARGUMENT);
            expect(error.details ?? error.message).to.match(new RegExp(r.malformed.field, "i"));
            expect(refs(await listAll(driver(), a, r))).to.have.members(before);
          });

          it(`[API-005] (${driverName}) ${r.api}: get, update and delete of an unknown ref are NOT_FOUND`, async function () {
            const o = ops(driver(), a, r);
            if (r.get) expect(await codeOf(o.get(UNKNOWN_REF)), "get").to.equal(status.NOT_FOUND);
            if (r.update)
              expect(await codeOf(o.update(r.update(UNKNOWN_REF, world.unique()))), "update").to.equal(status.NOT_FOUND);
            expect(await codeOf(o.remove(UNKNOWN_REF)), "delete").to.equal(status.NOT_FOUND);
          });

          it(`[API-006] (${driverName}) ${r.api}: another workspace's ref is NOT_FOUND and stays unchanged`, async function () {
            const req = r.create(world.unique());
            const { ref } = await ops(driver(), a, r).create(req);
            const ob = ops(driver(), b, r);

            if (r.get) expect(await codeOf(ob.get(ref)), "get").to.equal(status.NOT_FOUND);
            if (r.update)
              expect(await codeOf(ob.update(r.update(ref, world.unique()))), "update").to.equal(status.NOT_FOUND);
            expect(await codeOf(ob.remove(ref)), "delete").to.equal(status.NOT_FOUND);

            // A member of A acting as a workspace of their own is outside A too.
            const own = await world.as(world.memberA, await world.createWorkspace(world.memberA, `Own ${world.unique()}`));
            if (r.get) expect(await codeOf(ops(driver(), own, r).get(ref)), "get from a user's other workspace").to.equal(status.NOT_FOUND);
            expect(await codeOf(ops(driver(), own, r).remove(ref)), "delete from a user's other workspace").to.equal(status.NOT_FOUND);

            const still = (await listAll(driver(), a, r)).find((i) => i.ref === ref);
            expect(still, "A still has it").to.exist;
            expect(still![r.echo]).to.equal(req[r.echo]);
          });

          it(`[API-007] (${driverName}) ${r.api}: a workspace lists only its own resources`, async function () {
            const { ref: mine } = await ops(driver(), b, r).create(r.create(world.unique()));
            const { ref: theirs } = await ops(driver(), a, r).create(r.create(world.unique()));

            const listed = refs(await listAll(driver(), b, r));

            expect(listed).to.include(mine);
            expect(listed).to.not.include(theirs);
          });

          it(`[API-008] (${driverName}) ${r.api}: walking the pages returns every item once`, async function () {
            // Five in a row, so a page of two ends in the middle of a backend batch of A's items;
            // B's items (and other cases') make the per-workspace filtering span pages.
            const created: string[] = [];
            for (let i = 0; i < 5; i++)
              created.push((await ops(driver(), a, r).create(r.create(world.unique()))).ref);
            for (let i = 0; i < 5; i++) await ops(driver(), b, r).create(r.create(world.unique()));

            const all = refs(await listAll(driver(), a, r, 2));

            expect(new Set(all).size, "no item twice").to.equal(all.length);
            expect(all).to.include.members(created);
            expect(all.sort()).to.deep.equal(refs(await listAll(driver(), a, r, 1000)).sort());
          });

          it(`[API-009] (${driverName}) ${r.api}: a page size that is not a positive integer is INVALID_ARGUMENT`, async function () {
            expect(await codeOf(ops(driver(), a, r).list({ pageSize: -1 }))).to.equal(status.INVALID_ARGUMENT);
          });

          it(`[API-010] (${driverName}) ${r.api}: a deleted resource is gone from get and list, and a second delete is NOT_FOUND`, async function () {
            const o = ops(driver(), a, r);
            const { ref } = await o.create(r.create(world.unique()));

            await o.remove(ref);

            if (r.get) expect(await codeOf(o.get(ref)), "get").to.equal(status.NOT_FOUND);
            expect(refs(await listAll(driver(), a, r))).to.not.include(ref);
            expect(await codeOf(o.remove(ref)), "second delete").to.equal(status.NOT_FOUND);
          });
        });
      }
    });
  }
});
