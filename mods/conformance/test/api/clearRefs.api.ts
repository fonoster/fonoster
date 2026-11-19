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
import { expect } from "chai";
import { Driver, Who } from "./drivers";
import { getWorld, World } from "./world";

// management-api "An empty reference clears it" (API-084, #1450), through both clients against
// Routr 3: Routr stores the refs, so only a real Routr shows a rename keeps them and "" clears them.

type Item = Record<string, unknown> & { ref: string };

const refOf = (value: unknown) =>
  (value as { ref?: string } | undefined | null)?.ref || undefined;

describe("@api management-api: an empty reference clears it (#1450)", function () {
  this.timeout(60_000);
  let world: World;
  let who: Who;

  before(async function () {
    world = await getWorld();
    who = await world.as(world.ownerA, world.wsA);
  });

  for (const driverName of ["sdk", "grpc"] as const) {
    describe(driverName, function () {
      const d = () =>
        world.drivers.find((x) => x.name === driverName) as Driver;
      const call = <T = Item>(api: string, method: string, req: unknown) =>
        d().call<T>(who, api, method, req);
      const create = async (api: string, method: string, req: unknown) =>
        (await call<{ ref: string }>(api, method, req)).ref;

      it(`[API-084] (${driverName}) an empty ref clears, an absent one keeps`, async function () {
        const u = world.unique();
        const trunkRef = await create("Trunks", "createTrunk", {
          name: `Carrier ${u}`,
          inboundUri: `c${u}.pstn.fonoster.local`,
          uris: [
            {
              host: "sip.carrier.example.com",
              port: 5060,
              transport: "UDP",
              weight: 1,
              priority: 1
            }
          ]
        });
        const appRef = await create("Applications", "createApplication", {
          name: `Answerer ${u}`,
          type: "STREAM",
          url: "wss://apps.example.com/session"
        });
        const digits = String(Math.floor(Math.random() * 1e7)).padStart(7, "0");
        const numberRef = await create("Numbers", "createNumber", {
          name: `Front desk ${u}`,
          telUrl: `tel:+1809${digits}`,
          city: "Santo Domingo",
          country: "Dominican Republic",
          countryIsoCode: "DO",
          trunkRef,
          appRef
        });
        const number = () => call("Numbers", "getNumber", { ref: numberRef });

        await call("Numbers", "updateNumber", {
          ref: numberRef,
          name: `Sales ${u}`
        });
        const renamed = await number();
        expect(refOf(renamed.trunk), "trunk after a rename").to.equal(trunkRef);
        expect(renamed.appRef, "app after a rename").to.equal(appRef);

        await call("Numbers", "updateNumber", {
          ref: numberRef,
          trunkRef: "",
          appRef: ""
        });
        const cleared = await number();
        expect(refOf(cleared.trunk), "trunk after the clear").to.equal(
          undefined
        );
        expect(cleared.appRef || undefined, "appRef after the clear").to.equal(
          undefined
        );
        expect(
          cleared.agentAor || undefined,
          "agentAor after the clear"
        ).to.equal(undefined);

        const domainRef = await create("Domains", "createDomain", {
          name: `Acme ${u}`,
          domainUri: `r${u}.sip.fonoster.local`
        });
        const agentRef = await create("Agents", "createAgent", {
          name: `Jane ${u}`,
          username: `jane${u}`,
          domainRef
        });
        const agent = () => call("Agents", "getAgent", { ref: agentRef });
        await call("Agents", "updateAgent", {
          ref: agentRef,
          name: `Janet ${u}`
        });
        expect(refOf((await agent()).domain), "domain after a rename").to.equal(
          domainRef
        );

        await call("Agents", "updateAgent", { ref: agentRef, domainRef: "" });
        expect(
          refOf((await agent()).domain),
          "domain after the clear"
        ).to.equal(undefined);
      });
    });
  }
});
