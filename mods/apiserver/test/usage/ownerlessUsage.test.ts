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
import { NatsConnection, StringCodec } from "nats";
import { publishRecordedUsageOnce } from "../../src/usage/publishRecordedUsage";
import { UsageSql } from "../../src/usage/types";

// The billing outbox with an ownerless row first in line, without services. The fake db applies
// `published_at IS NULL`, the limit, and the owner filter only when the query asks for it, so the
// test proves the SQL filter; the fake NATS rejects `billing.usage.` the way the server does.

const sc = StringCodec();

type FakeRow = {
  id: string;
  owner_ref: string;
  published_at: Date | null;
};

const fakeDb = (rows: FakeRow[]): UsageSql => ({
  async $queryRawUnsafe<T>(query: string, limit: unknown) {
    const ownedOnly = /owner_ref\s*<>\s*''/.test(query);
    return rows
      .filter((r) => r.published_at === null)
      .filter((r) => !ownedOnly || r.owner_ref !== "")
      .slice(0, Number(limit))
      .map((r) => ({
        id: r.id,
        owner_ref: r.owner_ref,
        workspace_ref: "WOownerless000000000000000000000",
        app_ref: null,
        call_ref: `call-${r.id}`,
        region: "default",
        region_kind: "public",
        origin: "call",
        meter: "tts.characters",
        quantity: 100,
        provider: "elevenlabs",
        model: null,
        key_source: "platform",
        occurred_at: new Date(Date.UTC(2026, 10, 2))
      })) as T;
  },
  async $executeRawUnsafe(_query: string, ids: unknown) {
    const marked = rows.filter((r) => (ids as string[]).includes(r.id));
    marked.forEach((r) => (r.published_at = new Date()));
    return marked.length;
  }
});

const fakeNats = (published: { subject: string; id: string }[]) =>
  ({
    jetstream: () => ({
      async publish(subject: string, data: Uint8Array) {
        if (subject.endsWith("."))
          throw new Error(`Permissions Violation for Publish to "${subject}"`);
        published.push({ subject, id: JSON.parse(sc.decode(data)).id });
      }
    })
  }) as unknown as NatsConnection;

describe("@apiserver/usage ownerless usage in the billing outbox", () => {
  it("[BIL-055] publishes the owned rows behind an ownerless row, in order, and leaves it unpublished", async () => {
    const rows: FakeRow[] = [
      { id: "u0", owner_ref: "", published_at: null },
      { id: "u1", owner_ref: "user-a", published_at: null },
      { id: "u2", owner_ref: "user-b", published_at: null },
      { id: "u3", owner_ref: "user-a", published_at: null }
    ];
    const published: { subject: string; id: string }[] = [];
    const nc = fakeNats(published);
    const db = fakeDb(rows);

    expect(await publishRecordedUsageOnce(nc, db, 2)).to.equal(2);
    expect(await publishRecordedUsageOnce(nc, db, 2)).to.equal(1);
    expect(await publishRecordedUsageOnce(nc, db, 2)).to.equal(0);

    expect(published).to.deep.equal([
      { subject: "billing.usage.user-a", id: "u1" },
      { subject: "billing.usage.user-b", id: "u2" },
      { subject: "billing.usage.user-a", id: "u3" }
    ]);
    expect(rows.find((r) => r.id === "u0")!.published_at).to.equal(null);
    expect(rows.filter((r) => r.owner_ref).every((r) => r.published_at)).to.be
      .true;
  });
});
