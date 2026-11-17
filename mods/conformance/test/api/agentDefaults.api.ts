/*
 * Copyright (C) 2026 by Fonoster Inc (https://fonoster.com)
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

// management-api "A new SIP agent is enabled and not private" (API-080, #1423), against Routr 3:
// Routr enforces both fields, and an omitted proto3 field reaches it as false and PRIVATE.

describe("@api management-api: SIP agent defaults (#1423)", function () {
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

      it(`[API-080] (${driverName}) an Agent created without enabled and privacy is enabled and not private`, async function () {
        const u = world.unique();
        const { ref } = await d().call<{ ref: string }>(
          who,
          "Agents",
          "createAgent",
          {
            name: `Jane ${u}`,
            username: `jane${u}`
          }
        );
        const agent = await d().call<Record<string, unknown>>(
          who,
          "Agents",
          "getAgent",
          {
            ref
          }
        );
        expect(agent).to.deep.include({ enabled: true, privacy: "NONE" });
      });
    });
  }
});
