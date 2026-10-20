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
import { Usage } from "@fonoster/common";
import { GetUsageRequest, GetUsageResponse } from "@fonoster/types";
import { Metadata, status } from "@grpc/grpc-js";
import { expect } from "chai";
import { createGetUsage } from "../../src/usage/createGetUsage";
import { ingestUsageIn } from "../../src/usage/ingestUsage";
import { createTestDb, TestDb } from "../../../common/test/persistence/testDb";

// Usage/GetUsage on a real Postgres (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

const WS1 = "WOusageA000000000000000000000000";
const WS2 = "WOusageB000000000000000000000000";
const WS3 = "WOusageC000000000000000000000000";
const owners: Record<string, string> = {
  [WS1]: "owner",
  [WS2]: "owner",
  [WS3]: "someone-else"
};

const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const token = (access: { accessKeyId: string; role: string }[]) =>
  `${enc({ alg: "none" })}.${enc({ sub: "owner", tokenUse: "access", access })}.x`;

function callFor(
  request: Partial<GetUsageRequest>,
  accessKeyId = WS1,
  access = [{ accessKeyId: WS1, role: "WORKSPACE_MEMBER" }]
) {
  const metadata = new Metadata();
  metadata.set("accessKeyId", accessKeyId);
  metadata.set("token", token(access));
  return {
    request: { fromDay: "2026-10-01", toDay: "2026-10-31", ...request },
    metadata
  };
}

describe("@apiserver/usage GetUsage", function () {
  this.timeout(120_000);
  let db: TestDb | undefined;
  let getUsage: ReturnType<typeof createGetUsage>;

  const ask = (call: ReturnType<typeof callFor>) =>
    new Promise<{
      error: { code?: number } | null;
      response?: GetUsageResponse;
    }>((resolve) =>
      getUsage(
        call as never,
        (error: { code?: number } | null, response?: GetUsageResponse) =>
          resolve({ error, response })
      )
    );

  before(async function () {
    db = await createTestDb();
    if (!db) return this.skip();
    getUsage = createGetUsage(db.prisma);
    const directory = {
      workspace: async (ws: string) => ({ ownerRef: owners[ws] })
    };
    const at = (
      ws: string,
      day: string,
      origin: string,
      line: Usage.UsageLine,
      n: number
    ) => ({
      ...line,
      id: Usage.usageId(`${ws}|${day}|${origin}|${n}`, line),
      workspaceRef: ws,
      region: "default",
      regionKind: "public",
      origin,
      occurredAt: `${day}T12:00:00.000Z`
    });
    const stt = (keySource: Usage.KeySource, quantity: number) =>
      ({
        meter: "stt.seconds",
        quantity,
        provider: "deepgram",
        model: "deepgram/nova-3",
        keySource
      }) as Usage.UsageLine;
    await db.prisma.$transaction((tx: never) =>
      ingestUsageIn(tx, directory, [
        at(
          WS1,
          "2026-10-05",
          "call",
          { meter: "call.seconds", quantity: 600 },
          1
        ),
        at(
          WS1,
          "2026-10-06",
          "browser_test",
          { meter: "call.seconds", quantity: 120 },
          2
        ),
        at(WS1, "2026-10-05", "call", stt("workspace", 500), 3),
        at(WS1, "2026-10-06", "call", stt("platform", 100), 4),
        at(
          WS1,
          "2026-10-05",
          "api",
          { meter: "storage.bytes", quantity: 1000 },
          5
        ),
        at(
          WS1,
          "2026-10-06",
          "api",
          { meter: "storage.bytes", quantity: 1500 },
          6
        ),
        at(
          WS1,
          "2026-09-30",
          "call",
          { meter: "call.seconds", quantity: 999 },
          7
        ),
        at(
          WS2,
          "2026-10-07",
          "call",
          { meter: "call.seconds", quantity: 60 },
          8
        ),
        at(
          WS3,
          "2026-10-07",
          "call",
          { meter: "call.seconds", quantity: 30 },
          9
        )
      ])
    );
  });

  after(async () => db?.drop());

  it("groups a workspace's usage by meter and key source, within the range", async () => {
    const { error, response } = await ask(callFor({ groupBy: ["key_source"] }));
    expect(error).to.equal(null);
    expect(
      response!.rows.map((r) => [r.meter, r.keySource, r.unit, r.quantity])
    ).to.deep.equal([
      ["call.seconds", "", "second", 720],
      ["storage.bytes", "", "byte", 1500],
      ["stt.seconds", "platform", "second", 100],
      ["stt.seconds", "workspace", "second", 500]
    ]);
    expect(JSON.stringify(response)).to.not.match(
      /price|cost|amount|billable/i
    );
  });

  it("splits browser tests from calls by origin, and storage per day when grouped by day", async () => {
    const byOrigin = (
      await ask(callFor({ groupBy: ["origin"] }))
    ).response!.rows.filter((r) => r.meter === "call.seconds");
    expect(byOrigin.map((r) => [r.origin, r.quantity])).to.deep.equal([
      ["browser_test", 120],
      ["call", 600]
    ]);
    const byDay = (
      await ask(callFor({ groupBy: ["day"] }))
    ).response!.rows.filter((r) => r.meter === "storage.bytes");
    expect(byDay.map((r) => [r.day, r.quantity])).to.deep.equal([
      ["2026-10-05", 1000],
      ["2026-10-06", 1500]
    ]);
  });

  it("only answers for the caller's workspace", async () => {
    const { response } = await ask(
      callFor({}, WS3, [{ accessKeyId: WS3, role: "WORKSPACE_OWNER" }])
    );
    expect(response!.rows.map((r) => [r.meter, r.quantity])).to.deep.equal([
      ["call.seconds", 30]
    ]);
  });

  it("gives an owner every workspace they own, and refuses all_owned to a non-owner", async () => {
    const owner = [
      { accessKeyId: WS1, role: "WORKSPACE_OWNER" },
      { accessKeyId: WS2, role: "WORKSPACE_OWNER" },
      { accessKeyId: WS3, role: "WORKSPACE_MEMBER" }
    ];
    const { response } = await ask(
      callFor({ allOwned: true, groupBy: ["workspace"] }, WS1, owner)
    );
    expect(
      response!.rows
        .filter((r) => r.meter === "call.seconds")
        .map((r) => [r.workspaceRef, r.quantity])
    ).to.deep.equal([
      [WS1, 720],
      [WS2, 60]
    ]);
    const refused = await ask(callFor({ allOwned: true }));
    expect(refused.error?.code).to.equal(status.PERMISSION_DENIED);
  });

  it("rejects a bad range", async () => {
    expect(
      (await ask(callFor({ fromDay: "2026-11-01", toDay: "2026-10-01" }))).error
        ?.code
    ).to.equal(status.INVALID_ARGUMENT);
    expect((await ask(callFor({ fromDay: "yesterday" }))).error?.code).to.equal(
      status.INVALID_ARGUMENT
    );
  });
});
