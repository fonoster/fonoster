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
import { randomUUID } from "crypto";
import { expect } from "chai";
import { Who } from "./drivers";
import { getWorld, World } from "./world";

// call-record, the Calls API's view of the index: each record names the app that handled the call,
// and ListCalls filters by it (API-069 in mods/conformance/catalog/areas/api.md). The case writes
// the index rows the call-record service would write when it seals a record.

type Record = { ref: string; appRef?: string };

describe("@api calls", function () {
  this.timeout(60_000);
  let world: World;
  let a: Who;
  let appX: string;
  let appY: string;
  const refs: {
    x1: string;
    x2: string;
    y: string;
    none: string;
    theirs: string;
  } = {
    x1: randomUUID(),
    x2: randomUUID(),
    y: randomUUID(),
    none: randomUUID(),
    theirs: randomUUID()
  };

  const app = async (who: Who) =>
    (
      await world.raw.call<{ ref: string }>(
        who,
        "Applications",
        "createApplication",
        {
          name: `Answerer ${world.unique()}`,
          type: "STREAM",
          url: "wss://apps.example.com/session"
        }
      )
    ).ref;

  const index = (
    callRef: string,
    accessKeyId: string,
    appRef: string | null,
    minute: number
  ) =>
    world.stack.apiDb.prisma.callRecord.create({
      data: {
        callRef,
        accessKeyId,
        appRef,
        fromNumber: "+15550001111",
        toNumber: "+15550002222",
        direction: "inbound",
        status: "completed",
        startedAt: new Date(Date.UTC(2026, 9, 22, 12, minute)),
        endedAt: new Date(Date.UTC(2026, 9, 22, 12, minute, 30)),
        durationSeconds: 30,
        region: "local",
        location: "local",
        version: 1,
        parts: []
      }
    });

  before(async function () {
    world = await getWorld();
    a = await world.as(world.ownerA, world.wsA);
    appX = await app(a);
    appY = await app(a);
    await index(refs.x1, world.wsA.accessKeyId, appX, 1);
    await index(refs.x2, world.wsA.accessKeyId, appX, 2);
    await index(refs.y, world.wsA.accessKeyId, appY, 3);
    await index(refs.none, world.wsA.accessKeyId, null, 4);
    // Another workspace's call, handled by an app with the same ref.
    await index(refs.theirs, world.wsB.accessKeyId, appX, 5);
  });

  for (const driverName of ["sdk", "grpc"] as const) {
    describe(driverName, function () {
      const driver = () => world.drivers.find((d) => d.name === driverName)!;
      const list = (request: object) =>
        driver().call<{ items: Record[] }>(a, "Calls", "listCalls", {
          pageSize: 100,
          ...request
        });
      const ours = (items: Record[]) =>
        items.filter((i) => Object.values(refs).includes(i.ref));

      it(`[API-069] (${driverName}) each call record names the app that handled it, and ListCalls filters by it`, async function () {
        const all = ours((await list({})).items);
        const appOf = (ref: string) =>
          all.find((i) => i.ref === ref)?.appRef || "";
        expect(appOf(refs.x1), "x1").to.equal(appX);
        expect(appOf(refs.y), "y").to.equal(appY);
        expect(appOf(refs.none), "no app").to.equal("");
        expect(
          all.map((i) => i.ref),
          "unfiltered"
        ).to.have.members([refs.x1, refs.x2, refs.y, refs.none]);

        const got = await driver().call<Record>(a, "Calls", "getCall", {
          ref: refs.y
        });
        expect(got.appRef, "getCall").to.equal(appY);

        const filtered = (await list({ appRef: appX })).items;
        expect(
          filtered.map((i) => i.ref),
          "filtered"
        ).to.have.members([refs.x1, refs.x2]);
        expect(
          filtered.every((i) => i.appRef === appX),
          "every filtered record is the app's"
        ).to.equal(true);
      });
    });
  }
});
