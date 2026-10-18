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
import { expect } from "chai";
import {
  createTestDb,
  TestDb,
  testDatabaseUrl
} from "../../../common/test/persistence/testDb";
import { prismaRelaySlots } from "../../src/regions/relaySlots";

// The relay limit across apiserver replicas (ST-4, audit #6): slots are leased rows in Postgres,
// so three replicas together admit at most `max` relays per region. Needs
// PERSISTENCE_TEST_DATABASE_URL.

const REGION = "rg_relayslots00000";

describe("@apiserver/regions relay slots across replicas (database)", function () {
  this.timeout(60_000);
  let db: TestDb;

  before(async function () {
    if (!testDatabaseUrl()) return this.skip();
    db = (await createTestDb())!;
  });

  afterEach(async () => {
    await db?.prisma.regionRelaySlot.deleteMany();
  });

  after(async () => {
    await db?.drop();
  });

  it("admits at most 8 of 24 concurrent relays from three replicas, and frees slots", async function () {
    const replicas = [1, 2, 3].map(() => prismaRelaySlots(db.prisma));
    const results = await Promise.all(
      Array.from({ length: 24 }, (_, i) => replicas[i % 3].acquire(REGION, 8))
    );
    const granted = results.filter(Boolean) as (() => void)[];
    expect(granted).to.have.length(8);
    expect(await db.prisma.regionRelaySlot.count()).to.equal(8);
    // Another region is not affected.
    const other = await replicas[0].acquire("rg_otherregion0000", 8);
    expect(other).to.be.a("function");
    other!();
    // A finished relay frees its slot for any replica.
    granted[0]();
    await new Promise((r) => setTimeout(r, 100));
    expect(await replicas[2].acquire(REGION, 8)).to.be.a("function");
    expect(await replicas[1].acquire(REGION, 8)).to.equal(undefined);
    granted.slice(1).forEach((release) => release());
  });

  it("takes over the slot of a replica that died once its lease ran out", async function () {
    const slots = prismaRelaySlots(db.prisma);
    // A replica died holding the only slot: its lease expired a moment ago.
    await db.prisma.regionRelaySlot.create({
      data: {
        regionRef: REGION,
        slot: 0,
        holder: "dead-replica",
        expiresAt: new Date(Date.now() - 1000)
      }
    });
    const release = await slots.acquire(REGION, 1);
    expect(release).to.be.a("function");
    const row = await db.prisma.regionRelaySlot.findFirst();
    expect(row.holder).to.not.equal("dead-replica");
    expect(await slots.acquire(REGION, 1)).to.equal(undefined);
    release!();
  });
});
