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
  createIndexRecord,
  createSearchRecords,
  RecordIndexEntry,
  RecordsDb
} from "../../src/records";
import { createTestDb, TestDb } from "../../../common/test/persistence/testDb";

// The records search and index on a real Postgres (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

const WS = "WOrecords000000000000000000000000";
const T = "2026-10-20T12:00:00.000Z";

const entry = (callRef: string, startedAt = T): RecordIndexEntry =>
  ({
    callRef,
    workspaceRef: WS,
    appRef: "app-1",
    from: "+15550001111",
    to: "+15550002222",
    direction: "inbound",
    status: "completed",
    endReason: "hangup",
    failureReason: null,
    sipStatus: null,
    startedAt,
    endedAt: null,
    durationSeconds: 0,
    region: "default",
    location: "file:///tmp/records",
    version: 1,
    size: 1,
    parts: []
  }) as unknown as RecordIndexEntry;

describe("@apiserver records on Postgres (#1069)", function () {
  this.timeout(120_000);
  let db: TestDb | undefined;

  before(async function () {
    db = await createTestDb();
    if (!db) return this.skip();
  });

  after(async () => db?.drop());

  it("pages through records sharing a start time, counting on the first page only", async function () {
    const records = db!.prisma as unknown as RecordsDb;
    const index = createIndexRecord(records, undefined, async () => "Acme");
    const refs = ["call-a", "call-b", "call-c", "call-d", "call-e"];
    for (const ref of refs) await index(entry(ref));
    await index(entry("call-early", "2026-10-20T11:59:59.000Z"));

    const search = createSearchRecords(records);
    const seen: string[] = [];
    const totals: (number | undefined)[] = [];
    let pageToken: string | undefined;
    do {
      const page = await search(
        WS,
        { pageSize: 2, pageToken },
        { total: true }
      );
      totals.push(page.total);
      seen.push(...page.items.map((r) => r.callRef));
      pageToken = page.nextPageToken || undefined;
    } while (pageToken);
    expect(seen).to.deep.equal([...refs].reverse().concat("call-early"));
    // Three full pages, then an empty one: counted on the first only.
    expect(totals).to.deep.equal([6, undefined, undefined, undefined]);

    // The trunk is stored with the row, and a later version keeps it.
    await createIndexRecord(
      records,
      undefined,
      async () => "Moved"
    )({
      ...entry("call-a"),
      version: 2
    });
    const row = await records.callRecord.findUnique({
      where: { callRef: "call-a" }
    });
    expect(row).to.deep.include({ version: 2, trunkName: "Acme" });
  });
});
