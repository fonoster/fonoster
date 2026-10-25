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
import { FakeWebhookReceiver } from "@fonoster/conformance";
import * as fs from "fs";
import * as path from "path";
import { runWithDatabase } from "../../src/registry/cli";
import {
  MemoryRegistryStore,
  PrismaRegistryStore,
  PrismaUsageSource,
  Registry
} from "../../src/registry";
import {
  PrismaWebhookStore,
  WebhookDispatcher,
  callStarted,
  verifyWebhook
} from "../../src/webhooks";
import { createTestDb, TestDb, testDatabaseUrl } from "./testDb";

// Runs against a throwaway Postgres (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

const NOW = new Date("2026-10-15T08:00:00Z");

function seedCatalog(r: Registry) {
  r.addProvider({
    id: "elevenlabs",
    adapter: "elevenlabs",
    capabilities: ["tts"],
    credentialRef: "elevenlabs"
  });
  r.addModel({
    id: "elevenlabs/turbo-v2",
    type: "tts",
    features: ["streaming"],
    settings: ["style", "stability"]
  });
  r.addModel({
    id: "elevenlabs/flash-v2.5",
    type: "tts",
    features: ["streaming", "word-timings"],
    settings: ["stability"]
  });
  r.addVoice({
    id: "elevenlabs/rachel",
    models: ["elevenlabs/turbo-v2", "elevenlabs/flash-v2.5"],
    language: "en",
    gender: "female"
  });
  r.addVoice({ id: "elevenlabs/nova-legacy", models: ["elevenlabs/turbo-v2"] });
  r.addVoice({ id: "elevenlabs/bella", models: ["elevenlabs/flash-v2.5"] });
  r.addProvider({
    id: "openai",
    adapter: "openai",
    capabilities: ["llm"],
    credentialRef: "openai"
  });
  r.addModel({
    id: "openai/gpt-4o",
    type: "llm",
    features: ["streaming", "tool-calling"]
  });
  r.addModel({ id: "openai/gpt-5-mini", type: "llm", features: ["streaming"] });
}

describe("@common/persistence (Prisma stores)", function () {
  let db: TestDb;

  before(async function () {
    if (!testDatabaseUrl()) return this.skip();
    this.timeout(120_000);
    db = (await createTestDb())!;
  });
  after(async () => db?.drop());

  describe("PrismaRegistryStore", function () {
    it("persists the catalog and audit log and exports byte-identical to memory", async function () {
      const store = await PrismaRegistryStore.open(db.prisma);
      const mem = new MemoryRegistryStore();
      const a = new Registry({ store, actor: "ops", now: () => NOW });
      const b = new Registry({ store: mem, actor: "ops", now: () => NOW });
      seedCatalog(a);
      seedCatalog(b);
      await store.flush();

      const reopened = await PrismaRegistryStore.open(db.prisma);
      expect(reopened.all()).to.deep.equal(mem.all());
      const c = new Registry({ store: reopened, actor: "ops" });
      expect(c.export()).to.equal(b.export());
      // Audit details are stored as JSON (undefined keys drop out).
      expect(c.history("elevenlabs/rachel")).to.deep.equal(
        JSON.parse(JSON.stringify(b.history("elevenlabs/rachel")))
      );
    });

    it("apply into another database is idempotent", async function () {
      const other = await createTestDb();
      try {
        const source = new Registry({
          store: await PrismaRegistryStore.open(db.prisma),
          actor: "ops"
        });
        const store = await PrismaRegistryStore.open(other!.prisma);
        const target = new Registry({ store, actor: "ci" });
        const file = source.export();
        expect(target.apply(file).length).to.be.greaterThan(0);
        await store.flush();
        const again = new Registry({
          store: await PrismaRegistryStore.open(other!.prisma),
          actor: "ci"
        });
        expect(again.plan(file)).to.deep.equal([]);
        expect(again.export()).to.equal(file);
      } finally {
        await other!.drop();
      }
    });

    it("has no column that can hold a credential (secret safety)", async function () {
      const cols: { table_name: string; column_name: string }[] =
        await db.prisma.$queryRawUnsafe(
          `select table_name, column_name from information_schema.columns
           where table_schema = 'public' and table_name like 'registry_%'`
        );
      expect(cols.length).to.be.greaterThan(10);
      const bad = cols.filter((c) =>
        /(secret|api_?key|token|password|private|hash)/i.test(c.column_name)
      );
      expect(bad).to.deep.equal([]);
    });
  });

  describe("PrismaUsageSource", function () {
    before(async () => {
      await db.prisma.product.create({
        data: {
          ref: "llm.openai",
          name: "OpenAI",
          vendor: "OPENAI",
          type: "LLM"
        }
      });
      const app = (
        ref: string,
        ws: string,
        voice: string,
        settings?: Record<string, unknown>
      ) =>
        db.prisma.application.create({
          data: {
            ref,
            accessKeyId: ws,
            name: ref,
            type: "STREAM",
            endpoint: "",
            url: "wss://bot.example.com/agent",
            protocol: "fonoster",
            speechVoice: voice,
            speechTtsModel: "elevenlabs/turbo-v2",
            speechLanguage: "en-US",
            speechSettings: settings
          }
        });
      await app("a1", "WO1", "elevenlabs/rachel", { style: 0.3, stability: 1 });
      await app("a2", "WO1", "elevenlabs/rachel");
      await app("a3", "WO2", "elevenlabs/nova-legacy");
      await app("a4", "WO2", "elevenlabs/rachel");
      await db.prisma.application.create({
        data: {
          ref: "bot",
          accessKeyId: "WO2",
          name: "billing bot",
          type: "AUTOPILOT",
          endpoint: "",
          intelligence: {
            create: {
              productRef: "llm.openai",
              config: {
                conversationSettings: { systemPrompt: "hi" },
                languageModel: {
                  model: "openai/gpt-4o",
                  tools: [{ name: "lookup" }]
                }
              }
            }
          }
        }
      });
    });

    it("finds usages in apps and agents across workspaces", async function () {
      const usages = await PrismaUsageSource.open(db.prisma);
      const r = new Registry({
        store: await PrismaRegistryStore.open(db.prisma),
        usages
      });
      expect(
        r.usage("elevenlabs/turbo-v2").map((u) => u.config.ref)
      ).to.deep.equal(["a1", "a2", "a3", "a4"]);
      const llm = r.usage("openai/gpt-4o");
      expect(llm).to.have.length(1);
      expect(llm[0].config).to.include({ kind: "agent", ref: "bot" });
      expect(llm[0].requires).to.include("tool-calling");
      // gpt-5-mini lacks tool calling: the agent cannot move.
      const impact = r.impact("openai/gpt-4o", "openai/gpt-5-mini");
      expect(impact.unmappable).to.have.length(1);
    });

    it("deprecate stores one notice per workspace and hands it on", async function () {
      const seen: string[] = [];
      const usages = await PrismaUsageSource.open(db.prisma, {
        onNotice: (ws, n) => seen.push(`${ws}:${n.type}`)
      });
      const store = await PrismaRegistryStore.open(db.prisma);
      const r = new Registry({ store, usages, actor: "ops" });
      r.deprecate(
        "model",
        "elevenlabs/turbo-v2",
        "elevenlabs/flash-v2.5",
        "2027-01-31"
      );
      await usages.flush();
      await store.flush();
      expect(seen.sort()).to.deep.equal([
        "WO1:provider.deprecated",
        "WO2:provider.deprecated"
      ]);
      expect(await db.prisma.registryNotice.count()).to.equal(2);
      const reopened = await PrismaRegistryStore.open(db.prisma);
      expect(reopened.get("elevenlabs/turbo-v2")).to.include({
        state: "deprecated",
        replacement: "elevenlabs/flash-v2.5"
      });
    });

    it("retire rewrites configs, drops settings and skips configs changed meanwhile", async function () {
      const usages = await PrismaUsageSource.open(db.prisma);
      const store = await PrismaRegistryStore.open(db.prisma);
      const r = new Registry({ store, usages, actor: "ops" });
      // a4 changes after the utility read it.
      await db.prisma.application.update({
        where: { ref: "a4" },
        data: { speechVoice: "elevenlabs/bella" }
      });
      const report = r.retire("model", "elevenlabs/turbo-v2", {
        "nova-legacy": "bella"
      });
      expect(report.mappable).to.have.length(4);
      await usages.flush();
      await store.flush();
      const rows = await db.prisma.application.findMany({
        where: { ref: { in: ["a1", "a2", "a3", "a4"] } },
        orderBy: { ref: "asc" }
      });
      expect(
        rows.map((x: { speechTtsModel: string }) => x.speechTtsModel)
      ).to.deep.equal([
        "elevenlabs/flash-v2.5",
        "elevenlabs/flash-v2.5",
        "elevenlabs/flash-v2.5",
        "elevenlabs/turbo-v2"
      ]);
      expect(rows[0].speechSettings).to.deep.equal({ stability: 1 });
      expect(rows[2].speechVoice).to.equal("elevenlabs/bella");
      expect(usages.conflicts.map((c) => c.usage.config.ref)).to.deep.equal([
        "a4"
      ]);
      const reopened = await PrismaRegistryStore.open(db.prisma);
      expect(reopened.get("elevenlabs/turbo-v2")!.state).to.equal("retired");
      expect(
        reopened
          .history("elevenlabs/turbo-v2")
          .filter((h) => h.action === "rewrite-config")
      ).to.have.length(4);
    });

    it("rewrites an agent's model", async function () {
      const usages = await PrismaUsageSource.open(db.prisma);
      const store = await PrismaRegistryStore.open(db.prisma);
      const r = new Registry({ store, usages, actor: "ops" });
      r.addModel({
        id: "openai/gpt-5",
        type: "llm",
        features: ["streaming", "tool-calling"]
      });
      r.deprecate("model", "openai/gpt-4o", "openai/gpt-5", "2027-01-31");
      r.retire("model", "openai/gpt-4o");
      await usages.flush();
      await store.flush();
      const intel = await db.prisma.intelligence.findFirst({
        where: { applicationRef: "bot" }
      });
      expect(intel.config.languageModel.model).to.equal("openai/gpt-5");
      expect(intel.config.languageModel.tools).to.have.length(1);
    });
  });

  describe("PrismaWebhookStore", function () {
    let receiver: FakeWebhookReceiver;
    beforeEach(async () => {
      receiver = await new FakeWebhookReceiver().start();
    });
    afterEach(() => receiver.stop());

    it("keeps endpoints, deliveries and the rotation window across restarts", async function () {
      const store = await PrismaWebhookStore.open(db.prisma);
      const dispatcher = new WebhookDispatcher({
        store,
        allowInsecureUrls: true,
        allowedDestinations: ["127.0.0.1"]
      });
      const endpoint = dispatcher.createEndpoint({
        workspaceRef: "WO1",
        url: receiver.url,
        events: ["call.started"]
      });
      const old = endpoint.secret;
      const fresh = dispatcher.rotateSecret(endpoint.id, 60_000);
      const [d] = dispatcher.publish(
        callStarted("WO1", {
          callRef: "c1",
          appRef: "a1",
          from: "+1",
          to: "+2",
          direction: "inbound"
        })
      );
      expect(await dispatcher.runDue()).to.equal(1);
      await store.flush();
      const got = receiver.received[0];
      for (const secret of [old, fresh])
        expect(verifyWebhook(got.body, got.headers, secret)).to.equal(true);

      const again = await PrismaWebhookStore.open(db.prisma);
      const [e] = again.endpoints("WO1");
      expect(e).to.include({
        id: endpoint.id,
        secret: fresh,
        previousSecret: old
      });
      expect(e.previousUntil).to.be.a("number");
      const log = await again.loadDeliveries({ endpointId: endpoint.id });
      expect(log.map((x) => [x.id, x.status, x.attempts])).to.deep.equal([
        [d.id, "succeeded", 1]
      ]);
      // Resend from another process, with the same event id.
      const resent = await new WebhookDispatcher({
        store: again,
        allowInsecureUrls: true,
        allowedDestinations: ["127.0.0.1"]
      }).resend(d.id);
      expect(resent.status).to.equal("succeeded");
      expect(receiver.received[1].json.id).to.equal(got.json.id);
    });

    it("adopts overdue pending deliveries exactly once", async function () {
      let clock = Date.now();
      const a = await PrismaWebhookStore.open(db.prisma, { now: () => clock });
      const dispatcher = new WebhookDispatcher({
        store: a,
        allowInsecureUrls: true,
        allowedDestinations: ["127.0.0.1"],
        now: () => clock
      });
      dispatcher.createEndpoint({
        workspaceRef: "WO3",
        url: receiver.url,
        events: ["call.started"]
      });
      dispatcher.publish(
        callStarted("WO3", {
          callRef: "c9",
          appRef: "a1",
          from: "+1",
          to: "+2",
          direction: "inbound"
        })
      );
      await a.flush();
      // The owner dies; two minutes later two dispatchers start.
      clock += 120_000;
      const b = await PrismaWebhookStore.open(db.prisma, {
        adoptOverdue: true,
        now: () => clock
      });
      const c = await PrismaWebhookStore.open(db.prisma, {
        adoptOverdue: true,
        now: () => clock
      });
      expect(
        b.deliveries().filter((d) => d.status === "pending")
      ).to.have.length(1);
      expect(c.deliveries()).to.have.length(0);
      const sent = await new WebhookDispatcher({
        store: b,
        allowInsecureUrls: true,
        allowedDestinations: ["127.0.0.1"],
        now: () => clock
      }).runDue();
      expect(sent).to.equal(1);
      expect(receiver.received).to.have.length(1);
    });
  });

  describe("fonoster-registry --store database", function () {
    it("adds, deprecates with a provider.deprecated webhook, and lists", async function () {
      const receiver = await new FakeWebhookReceiver().start();
      // The CLI's dispatcher delivers to the local receiver only if private destinations are
      // allowed (RV-B2); operators set the same variable when their endpoints are internal.
      const allowed = process.env.FONOSTER_ALLOWED_DESTINATIONS;
      process.env.FONOSTER_ALLOWED_DESTINATIONS = "127.0.0.1";
      try {
        const hooks = await PrismaWebhookStore.open(db.prisma);
        new WebhookDispatcher({
          store: hooks,
          allowInsecureUrls: true,
          allowedDestinations: ["127.0.0.1"]
        }).createEndpoint({
          workspaceRef: "WO4",
          url: receiver.url,
          events: ["provider.deprecated"]
        });
        await hooks.flush();
        await db.prisma.application.create({
          data: {
            ref: "stt-app",
            accessKeyId: "WO4",
            name: "stt app",
            type: "STREAM",
            endpoint: "",
            speechSttModel: "deepgram/nova-2"
          }
        });
        const lines: string[] = [];
        const cli = (...argv: string[]) =>
          runWithDatabase(argv, (l) => lines.push(l), {
            prisma: db.prisma,
            actor: "ops@fonoster"
          });
        expect(
          await cli(
            "add-provider",
            "deepgram",
            "--adapter",
            "deepgram",
            "--capabilities",
            "stt",
            "--credential-ref",
            "deepgram",
            "--store",
            "database"
          )
        ).to.equal(0);
        expect(
          await cli(
            "add-model",
            "deepgram/nova-2",
            "--type",
            "stt",
            "--features",
            "streaming"
          )
        ).to.equal(0);
        expect(
          await cli(
            "add-model",
            "deepgram/nova-3",
            "--type",
            "stt",
            "--features",
            "streaming"
          )
        ).to.equal(0);
        expect(await cli("usage", "deepgram/nova-2")).to.equal(0);
        expect(lines.pop()).to.equal("WO4\tapp\tstt app");
        expect(
          await cli(
            "deprecate-model",
            "deepgram/nova-2",
            "--replacement",
            "deepgram/nova-3",
            "--retire-on",
            "2027-03-01"
          )
        ).to.equal(0);
        expect(receiver.received).to.have.length(1);
        expect(receiver.received[0].json).to.include({
          type: "provider.deprecated",
          workspaceRef: "WO4"
        });
        expect(receiver.received[0].json.data).to.deep.equal({
          id: "deepgram/nova-2",
          replacement: "deepgram/nova-3",
          retireOn: "2027-03-01"
        });
        lines.length = 0;
        expect(await cli("list", "model")).to.equal(0);
        expect(lines).to.include("model\tdeepgram/nova-2\tdeprecated");
        lines.length = 0;
        await cli("history", "deepgram/nova-2");
        // newest first
        expect(lines.map((l) => l.split("\t").slice(1, 3))).to.deep.equal([
          ["ops@fonoster", "deprecate-model"],
          ["ops@fonoster", "add-model"]
        ]);
      } finally {
        if (allowed === undefined)
          delete process.env.FONOSTER_ALLOWED_DESTINATIONS;
        else process.env.FONOSTER_ALLOWED_DESTINATIONS = allowed;
        await receiver.stop();
      }
    });
  });

  describe("database roles (registry-roles.sql)", function () {
    /** Splits the script into statements, keeping `DO $$ ... $$;` blocks whole. */
    function statements(sql: string) {
      const out: string[] = [];
      let cur = "";
      let inBlock = false;
      for (const line of sql.split("\n")) {
        if (line.trim().startsWith("--") && !inBlock) continue;
        cur += line + "\n";
        if ((line.match(/\$\$/g) ?? []).length % 2 === 1) inBlock = !inBlock;
        if (!inBlock && line.trim().endsWith(";")) {
          out.push(cur.trim());
          cur = "";
        }
      }
      return out.filter(Boolean);
    }

    const as = (role: string, sql: string) =>
      db.prisma.$transaction(async (tx: typeof db.prisma) => {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
        return tx.$executeRawUnsafe(sql);
      });

    before(async () => {
      const sql = fs.readFileSync(
        path.resolve(__dirname, "../../../apiserver/sql/registry-roles.sql"),
        "utf8"
      );
      for (const st of statements(sql)) await db.prisma.$executeRawUnsafe(st);
    });

    it("the utility role writes the registry but nothing outside it", async function () {
      await as(
        "fonoster_registry",
        `insert into registry_audit (at, actor, action, target) values (now(), 'ops', 'test', 'x')`
      );
      await as(
        "fonoster_registry",
        `update applications set speech_voice = speech_voice where ref = 'a1'`
      );
      for (const sql of [
        `insert into secrets (ref, access_key_id, name, secret_hash) values ('s', 'WO1', 'k', 'v')`,
        `update applications set url = 'wss://evil' where ref = 'a1'`,
        `update registry_audit set actor = 'someone else'`,
        `delete from webhook_endpoints`
      ]) {
        let denied = false;
        try {
          await as("fonoster_registry", sql);
        } catch (e) {
          denied = /permission denied/.test((e as Error).message);
        }
        expect(denied, sql).to.equal(true);
      }
    });

    it("the reader role can only read the registry", async function () {
      let denied = false;
      try {
        await as(
          "fonoster_registry_reader",
          `insert into registry_providers (id, adapter, credential_ref) values ('x', 'fake', 'x')`
        );
      } catch (e) {
        denied = /permission denied/.test((e as Error).message);
      }
      expect(denied).to.equal(true);
      await db.prisma.$transaction(async (tx: typeof db.prisma) => {
        await tx.$executeRawUnsafe("SET LOCAL ROLE fonoster_registry_reader");
        const rows = await tx.$queryRawUnsafe(
          "select count(*)::int as n from registry_providers"
        );
        expect(rows[0].n).to.be.greaterThan(0);
      });
    });
  });
});
