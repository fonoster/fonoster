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
import { status } from "@grpc/grpc-js";
import { expect } from "chai";
import { codeOf, Who } from "./drivers";
import { getWorld, World } from "./world";

// call-record, the Calls API's view of the index: each record names the app that handled the call,
// ListCalls filters by it and by from/to, and rejects a malformed filter (API-069, API-070 and API-072 in mods/conformance/catalog/areas/api.md). The case writes
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
    minute: number,
    numbers: { from: string; to: string } = {
      from: "+15550001111",
      to: "+15550002222"
    }
  ) =>
    world.stack.apiDb.prisma.callRecord.create({
      data: {
        callRef,
        accessKeyId,
        appRef,
        fromNumber: numbers.from,
        toNumber: numbers.to,
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
    // y and none carry other numbers, in forms the index stores as the call carried them.
    await index(refs.y, world.wsA.accessKeyId, appY, 3, {
      from: "sip:+15550003333@carrier.example;user=phone",
      to: "+15550004444"
    });
    await index(refs.none, world.wsA.accessKeyId, null, 4, {
      from: "Acme Support",
      to: "+15550002222"
    });
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

      it(`[API-070] (${driverName}) a malformed app filter is INVALID_ARGUMENT, an empty one lists every app's calls`, async function () {
        expect(
          await codeOf(list({ appRef: "not-a-ref" })),
          "malformed filter"
        ).to.equal(status.INVALID_ARGUMENT);
        const all = ours((await list({ appRef: "" })).items);
        expect(
          all.map((i) => i.ref),
          "empty filter"
        ).to.have.members([refs.x1, refs.x2, refs.y, refs.none]);
      });

      it(`[API-072] (${driverName}) ListCalls filters by from and to, and a malformed number filter is INVALID_ARGUMENT`, async function () {
        const refsFor = async (request: object) =>
          ours((await list(request)).items).map((i) => i.ref);
        expect(
          await refsFor({ from: "+15550001111" }),
          "from number"
        ).to.have.members([refs.x1, refs.x2]);
        expect(
          await refsFor({
            from: "sip:+15550003333@carrier.example;user=phone"
          }),
          "from SIP URI"
        ).to.have.members([refs.y]);
        expect(
          await refsFor({ from: "Acme Support" }),
          "from caller ID"
        ).to.have.members([refs.none]);
        expect(
          await refsFor({ to: "+15550002222" }),
          "to number"
        ).to.have.members([refs.x1, refs.x2, refs.none]);
        expect(
          await refsFor({ to: "+15550004444" }),
          "to other number"
        ).to.have.members([refs.y]);
        expect(
          await refsFor({ from: "+15550001111", to: "+15550004444" }),
          "from and to"
        ).to.have.members([]);

        expect(
          await codeOf(list({ from: "+1555\r\nVia: x" })),
          "control characters in from"
        ).to.equal(status.INVALID_ARGUMENT);
        expect(
          await codeOf(list({ to: "+1".padEnd(257, "5") })),
          "oversize to"
        ).to.equal(status.INVALID_ARGUMENT);
      });
    });
  }
});
