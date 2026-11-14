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
import { CallError, Driver, Who } from "./drivers";
import { getWorld, World } from "./world";

// management-api "A Number carries the aliases its carrier sends" and "A Trunk carries its outbound
// number formats" (API-076 to API-079, #1387), through both clients against Routr 2.34: the
// fields are stored by Routr, so only a real Routr shows they are kept, cleared and refused.

type Item = Record<string, unknown> & { ref: string };

/** Routr's refusal reaches the caller as INVALID_ARGUMENT with its text in the message. */
async function refusal(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    const err = e as CallError;
    return { code: err.code, message: err.details ?? err.message };
  }
  throw new Error("the call succeeded");
}

const noPrefix = (value: unknown) => expect(value ?? "").to.equal("");

describe("@api management-api: aliases and number formats (#1387)", function () {
  this.timeout(60_000);
  let world: World;
  let who: Who;

  before(async function () {
    world = await getWorld();
    who = await world.as(world.ownerA, world.wsA);
  });

  for (const driverName of ["sdk", "grpc"] as const) {
    describe(driverName, function () {
      const d = () => world.drivers.find((x) => x.name === driverName) as Driver;
      const call = <T = Item>(api: string, method: string, req: unknown) =>
        d().call<T>(who, api, method, req);
      const digits = () =>
        String(Math.floor(Math.random() * 1e7)).padStart(7, "0");

      async function trunk(extra: Record<string, unknown> = {}) {
        const u = world.unique();
        return (
          await call<{ ref: string }>("Trunks", "createTrunk", {
            name: `Carrier ${u}`,
            inboundUri: `n${u}.pstn.fonoster.local`,
            uris: [
              {
                host: "sip.carrier.example.com",
                port: 5060,
                transport: "UDP",
                weight: 1,
                priority: 1
              }
            ],
            ...extra
          })
        ).ref;
      }

      const number = (trunkRef: string, extra: Record<string, unknown> = {}) =>
        call<{ ref: string }>("Numbers", "createNumber", {
          name: `Main line ${world.unique()}`,
          telUrl: `tel:+44207${digits()}`,
          city: "London",
          country: "United Kingdom",
          countryIsoCode: "GB",
          trunkRef,
          ...extra
        });

      it(`[API-076] (${driverName}) a Number's aliases are stored, kept by a name-only update and removed by clearAliases`, async function () {
        const { ref } = await number(await trunk(), { aliases: ["01234"] });
        const get = () => call("Numbers", "getNumber", { ref });
        expect((await get()).aliases).to.deep.equal(["01234"]);
        await call("Numbers", "updateNumber", { ref, name: "Front desk" });
        expect(await get()).to.deep.include({
          name: "Front desk",
          aliases: ["01234"]
        });
        await call("Numbers", "updateNumber", { ref, clearAliases: true });
        expect((await get()).aliases ?? []).to.deep.equal([]);
      });

      it(`[API-077] (${driverName}) an alias already used on the Trunk is refused with Routr's text`, async function () {
        const trunkRef = await trunk();
        const first = await number(trunkRef, { aliases: ["01234"] });
        const before = await call<{ items: Item[] }>("Numbers", "listNumbers", {
          pageSize: 1000
        });
        const refused = await refusal(
          number(trunkRef, { aliases: ["01234"] })
        );
        expect(refused.code).to.equal(status.INVALID_ARGUMENT);
        expect(refused.message).to.contain(
          `alias "01234" is already used by Number ${first.ref} on this Trunk`
        );
        const after = await call<{ items: Item[] }>("Numbers", "listNumbers", {
          pageSize: 1000
        });
        expect(after.items.length).to.equal(before.items.length);
      });

      it(`[API-078] (${driverName}) a Trunk's number formats are stored and kept by a name-only update`, async function () {
        const ref = await trunk({
          calledNumberFormat: "INTERNATIONAL",
          calledNumberPrefix: "9#",
          callerNumberFormat: "E164_WITHOUT_PLUS"
        });
        const get = () => call("Trunks", "getTrunk", { ref });
        const stored = {
          calledNumberFormat: "INTERNATIONAL",
          calledNumberPrefix: "9#",
          callerNumberFormat: "E164_WITHOUT_PLUS"
        };
        expect(await get()).to.deep.include(stored);
        await call("Trunks", "updateTrunk", { ref, name: "Backup carrier" });
        expect(await get()).to.deep.include({
          ...stored,
          name: "Backup carrier"
        });
      });

      it(`[API-079] (${driverName}) a reset clears the format with its prefix; without "" Routr refuses it`, async function () {
        const ref = await trunk({
          calledNumberFormat: "NATIONAL",
          calledNumberPrefix: "9"
        });
        const get = () => call("Trunks", "getTrunk", { ref });
        const refused = await refusal(
          call("Trunks", "updateTrunk", {
            ref,
            calledNumberFormat: "NUMBER_FORMAT_UNSPECIFIED"
          })
        );
        expect(refused.code).to.equal(status.INVALID_ARGUMENT);
        expect(refused.message).to.contain(
          "calledNumberPrefix needs calledNumberFormat e164-without-plus, national or international"
        );
        expect(await get()).to.deep.include({
          calledNumberFormat: "NATIONAL",
          calledNumberPrefix: "9"
        });
        await call("Trunks", "updateTrunk", {
          ref,
          calledNumberFormat: "NUMBER_FORMAT_UNSPECIFIED",
          calledNumberPrefix: ""
        });
        const reset = await get();
        expect(reset.calledNumberFormat).to.equal("NUMBER_FORMAT_UNSPECIFIED");
        noPrefix(reset.calledNumberPrefix);
      });
    });
  }
});
