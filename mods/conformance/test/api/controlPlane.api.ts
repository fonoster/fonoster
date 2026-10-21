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
import { connect, NatsConnection, StringCodec, Subscription } from "nats";
import { codeOf, Who } from "./drivers";
import { getWorld, World } from "./world";

// control-plane, the parts the API answers: CreateCall's `from` and `to`, and SIP resources that
// reference only their own workspace (API-050 to API-054 in mods/conformance/catalog/areas/api.md).
// The case stands in for call placement on `calls.create`, so it sees what would reach a Roomr node.

const sc = StringCodec();

describe("@api control-plane", function () {
  this.timeout(60_000);
  let world: World;
  let a: Who;
  let b: Who;
  let nc: NatsConnection;
  let placement: Subscription;
  const placed: Record<string, unknown>[] = [];

  before(async function () {
    world = await getWorld();
    a = await world.as(world.ownerA, world.wsA);
    b = await world.as(world.ownerB, world.wsB);
    nc = await connect({ servers: world.stack.natsUrl });
    placement = nc.subscribe("calls.create");
    void (async () => {
      for await (const msg of placement) {
        placed.push(JSON.parse(sc.decode(msg.data)));
        msg.respond(sc.encode(JSON.stringify({ type: "ack" })));
      }
    })();
  });

  after(async function () {
    placement?.unsubscribe();
    await nc?.close();
  });

  const number = async (who: Who, u: string) => {
    const telUrl = `+1555${String(parseInt(u, 16) % 10_000_000).padStart(7, "0")}`;
    await world.raw.call(who, "Numbers", "createNumber", {
      name: `Line ${u}`,
      telUrl: `tel:${telUrl}`,
      city: "Austin",
      country: "United States",
      countryIsoCode: "US"
    });
    return telUrl;
  };
  const app = async (who: Who) =>
    (
      await world.raw.call<{ ref: string }>(who, "Applications", "createApplication", {
        name: `Caller ${world.unique()}`,
        type: "STREAM",
        url: "wss://apps.example.com/session"
      })
    ).ref;

  for (const driverName of ["sdk", "grpc"] as const) {
    describe(driverName, function () {
      const driver = () => world.drivers.find((d) => d.name === driverName)!;

      it(`[API-050] (${driverName}) CreateCall from another workspace's number is PERMISSION_DENIED and nothing is placed`, async function () {
        const theirs = await number(b, world.unique());
        const before = placed.length;

        const code = await codeOf(driver().call(a, "Calls", "createCall", { from: theirs, to: "+15551230000", appRef: await app(a) }));

        expect(code).to.equal(status.PERMISSION_DENIED);
        expect(placed.length, "placements").to.equal(before);
      });

      it(`[API-051] (${driverName}) CreateCall from an own number is placed with that number`, async function () {
        const mine = await number(a, world.unique());
        const appRef = await app(a);

        await driver().call(a, "Calls", "createCall", { from: mine, to: "+15551230001", appRef });

        const call = placed.find((p) => p.appRef === appRef);
        expect(call, "placed").to.exist;
        expect(call!.from).to.equal(mine);
        expect(call!.accessKeyId).to.equal(world.wsA.accessKeyId);
      });

      it(`[API-052] (${driverName}) a CR or LF in from or to is INVALID_ARGUMENT`, async function () {
        const mine = await number(a, world.unique());
        const appRef = await app(a);
        const before = placed.length;

        expect(await codeOf(driver().call(a, "Calls", "createCall", { from: `${mine}\r\nX-Evil: 1`, to: "+15551230002", appRef })), "from").to.equal(status.INVALID_ARGUMENT);
        expect(await codeOf(driver().call(a, "Calls", "createCall", { from: mine, to: "+15551230002\nX-Evil: 1", appRef })), "to").to.equal(status.INVALID_ARGUMENT);
        expect(placed.length, "placements").to.equal(before);
      });

      it(`[API-053] (${driverName}) a trunk naming another workspace's credentials is INVALID_ARGUMENT and not created`, async function () {
        const u = world.unique();
        const { ref: credentialsRef } = await world.raw.call<{ ref: string }>(b, "Credentials", "createCredentials", {
          name: `B creds ${u}`,
          username: `bcreds${u}`,
          password: "s3cret-pass"
        });

        const code = await codeOf(
          driver().call(a, "Trunks", "createTrunk", {
            name: `Stolen ${u}`,
            inboundUri: `s${u}.pstn.fonoster.local`,
            outboundCredentialsRef: credentialsRef,
            uris: [{ host: "sip.carrier.example.com", port: 5060, transport: "UDP", weight: 1, priority: 1 }]
          })
        );

        expect(code).to.equal(status.INVALID_ARGUMENT);
        const trunks = await world.raw.call<{ items: { name: string }[] }>(a, "Trunks", "listTrunks", { pageSize: 1000 });
        expect(trunks.items.map((t) => t.name)).to.not.include(`Stolen ${u}`);
      });

      it(`[API-054] (${driverName}) an agent in another workspace's domain is INVALID_ARGUMENT, on create and on update`, async function () {
        const u = world.unique();
        const { ref: domainRef } = await world.raw.call<{ ref: string }>(b, "Domains", "createDomain", {
          name: `B domain ${u}`,
          domainUri: `b${u}.sip.fonoster.local`
        });

        expect(
          await codeOf(driver().call(a, "Agents", "createAgent", { name: `Intruder ${u}`, username: `intruder${u}`, domainRef })),
          "create"
        ).to.equal(status.INVALID_ARGUMENT);

        const { ref } = await world.raw.call<{ ref: string }>(a, "Agents", "createAgent", { name: `Jane ${u}`, username: `jane2${u}` });
        expect(await codeOf(driver().call(a, "Agents", "updateAgent", { ref, domainRef })), "update").to.equal(status.INVALID_ARGUMENT);
      });
    });
  }
});
