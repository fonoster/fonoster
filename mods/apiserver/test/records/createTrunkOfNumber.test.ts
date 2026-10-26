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
import { createTrunkOfNumber, numberKey } from "../../src/records";

/** Routr's Numbers, one per page, counting the listings. */
function routrNumbers(
  items: {
    telUrl: string;
    trunk?: { name: string };
    extended?: Record<string, unknown>;
  }[]
) {
  const lister = {
    listings: 0,
    async listNumbers(request: { pageSize: number; pageToken?: string }) {
      const i = Number(request.pageToken ?? 0);
      if (i === 0) lister.listings++;
      return {
        items: items.slice(i, i + 1),
        nextPageToken: i + 1 < items.length ? String(i + 1) : ""
      };
    }
  };
  return lister;
}

describe("@apiserver records/createTrunkOfNumber", function () {
  const numbers = () =>
    routrNumbers([
      {
        telUrl: "tel:+15550002222",
        trunk: { name: "Acme PSTN" },
        extended: { accessKeyId: "ws-1" }
      },
      { telUrl: "tel:+15550003333", extended: { accessKeyId: "ws-1" } },
      {
        telUrl: "tel:+15550004444",
        trunk: { name: "Other" },
        extended: { accessKeyId: "ws-2" }
      }
    ]);

  it("names the trunk of the workspace's Number, across pages", async function () {
    const trunkOf = createTrunkOfNumber(numbers());
    expect(await trunkOf("ws-1", "+15550002222")).to.equal("Acme PSTN");
    // A Number without a trunk, or another workspace's Number, has none.
    expect(await trunkOf("ws-1", "+15550003333")).to.equal(undefined);
    expect(await trunkOf("ws-1", "+15550004444")).to.equal(undefined);
    expect(await trunkOf("ws-2", "+15550004444")).to.equal("Other");
  });

  it("reads a call's number as a URI, a telUrl or bare digits", async function () {
    const trunkOf = createTrunkOfNumber(numbers());
    for (const n of [
      "tel:+15550002222",
      "sip:+15550002222@sip.acme.com;user=phone",
      "<sip:15550002222@10.0.0.1>",
      "15550002222"
    ])
      expect(await trunkOf("ws-1", n)).to.equal("Acme PSTN");
    expect(numberKey("tel:+15550002222")).to.equal("+15550002222");
    expect(numberKey("alice")).to.equal("alice");
  });

  it("lists the Numbers once per ttl, and again on a miss at most every missMs", async function () {
    let clock = 0;
    const lister = numbers();
    const trunkOf = createTrunkOfNumber(lister, {
      ttlMs: 60_000,
      missMs: 10_000,
      now: () => clock
    });
    await Promise.all([
      trunkOf("ws-1", "+15550002222"),
      trunkOf("ws-1", "+15550002222")
    ]);
    expect(lister.listings).to.equal(1);
    clock = 5_000;
    await trunkOf("ws-1", "+15550002222");
    await trunkOf("ws-1", "+19999");
    expect(lister.listings).to.equal(1);
    clock = 15_000;
    await trunkOf("ws-1", "+19999");
    expect(lister.listings).to.equal(2);
    clock = 80_000;
    await trunkOf("ws-1", "+15550002222");
    expect(lister.listings).to.equal(3);
  });

  it("keeps a number Routr doesn't have, or one without a trunk, as known until the ttl", async function () {
    let clock = 0;
    const lister = numbers();
    const trunkOf = createTrunkOfNumber(lister, {
      ttlMs: 60_000,
      missMs: 10_000,
      now: () => clock
    });
    expect(await trunkOf("ws-1", "+19999")).to.equal(undefined);
    expect(await trunkOf("ws-1", "+15550003333")).to.equal(undefined);
    expect(lister.listings).to.equal(1);
    // Well past missMs, every new call on them is answered from the cache.
    for (clock = 11_000; clock < 60_000; clock += 11_000) {
      expect(await trunkOf("ws-1", "+19999")).to.equal(undefined);
      expect(await trunkOf("ws-1", "+15550003333")).to.equal(undefined);
    }
    expect(lister.listings).to.equal(1);
    clock = 60_000;
    await trunkOf("ws-1", "+19999");
    expect(lister.listings).to.equal(2);
  });

  it("runs one listing at a time, and doesn't retry a failed one for missMs", async function () {
    let clock = 0;
    let release!: () => void;
    let listings = 0;
    let fail = false;
    const lister = {
      async listNumbers() {
        listings++;
        if (fail) throw new Error("routr unreachable");
        await new Promise<void>((r) => (release = r));
        return {
          items: [
            {
              telUrl: "tel:+15550002222",
              trunk: { name: "Acme PSTN" },
              extended: { accessKeyId: "ws-1" }
            }
          ],
          nextPageToken: ""
        };
      }
    };
    const trunkOf = createTrunkOfNumber(lister, { now: () => clock });
    const lookups = [
      trunkOf("ws-1", "+15550002222"),
      trunkOf("ws-1", "+1777"),
      trunkOf("ws-2", "+1888")
    ];
    await new Promise((r) => setImmediate(r));
    expect(listings).to.equal(1);
    release();
    expect(await Promise.all(lookups)).to.deep.equal([
      "Acme PSTN",
      undefined,
      undefined
    ]);
    expect(listings).to.equal(1);

    // Routr down at the ttl: one attempt, then the last listing serves until missMs passes.
    fail = true;
    clock = 60_000;
    let failed = 0;
    await trunkOf("ws-1", "+15550002222").catch(() => failed++);
    expect(await trunkOf("ws-1", "+15550002222")).to.equal("Acme PSTN");
    expect([failed, listings]).to.deep.equal([1, 2]);
    clock = 70_000;
    await trunkOf("ws-1", "+15550002222").catch(() => failed++);
    expect([failed, listings]).to.deep.equal([2, 3]);
  });
});
