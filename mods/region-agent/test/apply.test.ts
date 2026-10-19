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
import { createTestDb, TestDb } from "../../common/test/persistence/testDb";
import { DatabaseApplier } from "../src/apply/DatabaseApplier";
import { ensureRoomrPeer, RoutrApplier } from "../src/apply/RoutrApplier";
import { regionDomainUri } from "../src/snapshot";
import { FakeRoutr } from "./fakeRoutr";
import {
  kindsOf,
  legacySnapshot,
  secondWorkspace,
  snapshot,
  WS,
  WS2
} from "./fixtures";

// add-private-regions task 3.3: config snapshots into the cell's Routr and database (PR-7).

describe("@region-agent Routr resources", function () {
  it("creates in dependency order, rewrites refs, updates and deletes by the ref map", async function () {
    const routr = new FakeRoutr();
    const applier = new RoutrApplier(routr);
    const r1 = await applier.apply(snapshot(1));
    expect(r1).to.deep.equal({ created: 5, updated: 0, deleted: 0, failed: 0 });
    const [agent] = routr.of("agents");
    const [domain] = routr.of("domains");
    expect(agent.domainRef).to.equal(domain.ref);
    expect(agent.domainRef).to.equal(applier.refs.domains!["cp-dom-1"]);
    expect(
      (domain.egressPolicies as { numberRef: string }[])[0].numberRef
    ).to.equal(applier.refs.numbers!["cp-num-1"]);
    expect(routr.of("numbers")[0].trunkRef).to.equal(
      applier.refs.trunks!["cp-trunk-1"]
    );

    const s2 = snapshot(2);
    kindsOf(s2).routr!.agents = [];
    kindsOf(s2).routr!.domains![0].name = "Office HQ";
    const r2 = await applier.apply(s2);
    expect(r2.deleted).to.equal(1);
    expect(r2.updated).to.equal(4);
    expect(routr.of("agents")).to.have.length(0);
    expect(routr.of("domains")[0].name).to.equal("Office HQ");

    // A resource removed by hand in the cell's Routr comes back on the next snapshot.
    await routr.delete("acls", applier.refs.acls!["cp-acl-1"]);
    const r3 = await applier.apply(snapshot(3));
    expect(r3.failed).to.equal(0);
    expect(routr.of("acls")).to.have.length(1);
  });

  it("applies every workspace's resources and drops a workspace that left (PR-14)", async function () {
    const routr = new FakeRoutr();
    const applier = new RoutrApplier(routr);
    await applier.apply(snapshot(1, {}, { [WS2]: secondWorkspace() }));
    expect(routr.of("domains").map((d) => d.name)).to.have.members([
      "Office",
      "Sales"
    ]);
    const r = await applier.apply(snapshot(2));
    expect(r.deleted).to.equal(1);
    expect(routr.of("domains").map((d) => d.name)).to.deep.equal(["Office"]);
    // A snapshot with no workspace left removes everything.
    const empty = snapshot(3);
    empty.workspaces = {};
    await applier.apply(empty);
    expect(routr.of("agents")).to.have.length(0);
    expect(routr.of("domains")).to.have.length(0);
  });

  it("moves domains under the region's SIP domain (PR-16)", async function () {
    const region = {
      sipDomain: "sip.acme.com",
      rootDomain: "sip.fonoster.local"
    };
    expect(regionDomainUri("sales.sip.fonoster.local", region)).to.equal(
      "sales.sip.acme.com"
    );
    expect(regionDomainUri("office.acme.local", region)).to.equal(
      "office.sip.acme.com"
    );
    expect(regionDomainUri("x.sip.acme.com", region)).to.equal(
      "x.sip.acme.com"
    );
    expect(
      regionDomainUri("sales.sip.fonoster.local", { sipDomain: null })
    ).to.equal("sales.sip.fonoster.local");

    const routr = new FakeRoutr();
    await new RoutrApplier(routr).apply(
      snapshot(
        1,
        {},
        { [WS2]: secondWorkspace() },
        { ...region, kind: "private" }
      )
    );
    expect(routr.of("domains").map((d) => d.domainUri)).to.have.members([
      "office.sip.acme.com",
      "sales.sip.acme.com"
    ]);
  });

  it("applies an old single-workspace snapshot", async function () {
    const routr = new FakeRoutr();
    const r = await new RoutrApplier(routr).apply(legacySnapshot(1));
    expect(r.created).to.equal(5);
  });

  it("creates the roomr peer once", async function () {
    const routr = new FakeRoutr();
    const peer = {
      name: "Roomr nodes",
      username: "roomr",
      aor: "sip:roomr@default",
      password: "p"
    };
    expect(await ensureRoomrPeer(routr, peer)).to.equal("created");
    expect(await ensureRoomrPeer(routr, peer)).to.equal("exists");
    expect(routr.of("peers")[0].credentialsRef).to.be.a("string");
  });
});

describe("@region-agent database snapshot (needs PERSISTENCE_TEST_DATABASE_URL)", function () {
  this.timeout(120_000);
  let db: TestDb | undefined;
  before(async function () {
    db = await createTestDb();
    if (!db) this.skip();
  });
  after(async () => db?.drop());

  it("writes apps, agents, catalog and webhooks into the tables AppBridge and Autopilot read", async function () {
    const applier = new DatabaseApplier(db!.prisma, {
      workspaceRef: WS,
      autopilot: { url: "ws://autopilot:3000", signingSecret: "cell-ap-secret" }
    });
    const r = await applier.apply(snapshot(1));
    expect(r).to.include({ apps: 2, agents: 1, catalog: 2, webhooks: 1 });
    const apps = await db!.prisma.application.findMany({
      include: { intelligence: true },
      orderBy: { ref: "asc" }
    });
    expect(apps.map((a: { ref: string }) => a.ref)).to.deep.equal([
      "app-bot",
      "app-support"
    ]);
    const [bot, support] = apps;
    // Forced to the region's workspace; Autopilot apps point at the cell's own Autopilot (PR-9).
    expect(support.accessKeyId).to.equal(WS);
    expect(support.recording).to.equal("on");
    expect(bot.url).to.equal("ws://autopilot:3000");
    expect(bot.signingSecret).to.equal("cell-ap-secret");
    expect(bot.intelligence.config.languageModel.model).to.equal(
      "groq/llama-3.3-70b"
    );
    expect(
      (await db!.prisma.product.findUnique({ where: { ref: "llm.groq" } }))
        .vendor
    ).to.equal("GROQ");
    expect(await db!.prisma.registryModel.count()).to.equal(1);
    expect((await db!.prisma.webhookEndpoint.findMany())[0]).to.include({
      ref: "wh-1",
      accessKeyId: WS,
      secret: "whsec"
    });

    // Full snapshots are authoritative: what is gone from the control plane goes from the cell.
    const r2 = await applier.apply(
      snapshot(2, {
        apps: [kindsOf(snapshot(1)).apps![0]],
        webhooks: [],
        // The control plane's shape (RG-B4): retention lands in call_record_retention.
        recordingPolicy: {
          recordings: true,
          retention: [{ part: "recording", days: 30 }]
        }
      })
    );
    expect(r2).to.include({
      apps: 1,
      removedApps: 1,
      removedWebhooks: 1,
      retention: 1
    });
    expect(
      await db!.prisma.callRecordRetention.findMany({
        select: { accessKeyId: true, part: true, days: true }
      })
    ).to.deep.equal([{ accessKeyId: WS, part: "recording", days: 30 }]);
    expect(await db!.prisma.application.count()).to.equal(1);
    expect(await db!.prisma.intelligence.count()).to.equal(0);
  });

  it("keys rows by workspace and removes a workspace that left the region (PR-14)", async function () {
    const applier = new DatabaseApplier(db!.prisma);
    const r = await applier.apply(
      snapshot(3, {}, { [WS2]: secondWorkspace() })
    );
    expect(r.workspaces).to.have.members([WS, WS2]);
    const sales = await db!.prisma.application.findUnique({
      where: { ref: "app-sales" }
    });
    expect(sales.accessKeyId).to.equal(WS2);
    expect(await applier.workspacesInCell()).to.have.members([WS, WS2]);

    const r2 = await applier.apply(snapshot(4));
    expect(r2.removedWorkspaces).to.deep.equal([WS2]);
    expect(
      await db!.prisma.application.count({ where: { accessKeyId: WS2 } })
    ).to.equal(0);
    expect(
      await db!.prisma.webhookEndpoint.count({ where: { accessKeyId: WS2 } })
    ).to.equal(0);
    expect(
      await db!.prisma.callRecordRetention.count({
        where: { accessKeyId: WS2 }
      })
    ).to.equal(0);
    expect(
      await db!.prisma.application.count({ where: { accessKeyId: WS } })
    ).to.equal(2);
  });

  it("applies an old single-workspace snapshot to the enrolled workspace", async function () {
    const applier = new DatabaseApplier(db!.prisma, { workspaceRef: WS });
    const r = await applier.apply(legacySnapshot(5));
    expect(r.workspaces).to.deep.equal([WS]);
    expect(r.apps).to.equal(2);
  });
});
