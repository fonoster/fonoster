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
import * as path from "path";
import { expect } from "chai";
import { FakesHarness, FakeWebhookReceiver, Peer } from "@fonoster/conformance";
import { Registry as RegistryNs, Webhooks } from "@fonoster/common";
import { connect, NatsConnection } from "nats";
import {
  createTestDb,
  TestDb,
  testDatabaseUrl
} from "../../common/test/persistence/testDb";
import {
  AppConfig,
  Gateway,
  GatewayConfig,
  PrismaAppStore,
  YamlAppStore,
  appFromRow,
  validateConfig
} from "../src";

// The app store (voice-session G2 app model) and the database-backed gateway wiring. Database
// tests need PERSISTENCE_TEST_DATABASE_URL; the end-to-end one also needs CONFORMANCE_NATS_URL.

const CLIENT = path.resolve(__dirname, "../../common/test/.prisma-client");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const yamlApp = (ref: string, extra: Partial<AppConfig> = {}): AppConfig => ({
  ref,
  url: "wss://bot.example.com",
  protocol: "fonoster",
  signingSecret: "s",
  speech: { voice: "fake/default", language: "en-US" },
  ...extra
});

describe("@gateway apps", function () {
  it("YAML store: by ref, by number, catch-all", function () {
    const store = new YamlAppStore([
      yamlApp("sales", { numbers: ["+1555"] }),
      yamlApp("any")
    ]);
    expect(store.find("sales")!.ref).to.equal("sales");
    expect(store.forNumber("+1555")!.ref).to.equal("sales");
    expect(store.forNumber("+1999")!.ref).to.equal("any");
    expect(store.count()).to.equal(2);
  });

  it("maps an applications row to the app model and ignores legacy rows", function () {
    expect(appFromRow({ ref: "legacy", url: null, signingSecret: null })).to.be
      .undefined;
    expect(appFromRow({ ref: "bad", url: "https://x", signingSecret: "s" })).to
      .be.undefined;
    expect(
      appFromRow({
        ref: "a",
        accessKeyId: "WO1",
        url: "wss://bot.example.com/agent",
        protocol: "twilio",
        signingSecret: "s3cret",
        speechVoice: "elevenlabs/rachel",
        speechLanguage: "es-419",
        silenceTimeoutMs: 800,
        audio: { codec: "pcmu", rate: 8000 },
        filters: [{ name: "levelGate" }],
        listeners: [{ url: "wss://l.example.com", tracks: "both" }],
        fallbackAppRef: "b",
        fallbackMessage: null
      })
    ).to.deep.equal({
      ref: "a",
      url: "wss://bot.example.com/agent",
      protocol: "twilio",
      signingSecret: "s3cret",
      speech: {
        voice: "elevenlabs/rachel",
        language: "es-419",
        silenceTimeoutMs: 800
      },
      workspaceRef: "WO1",
      audio: { codec: "pcmu", rate: 8000 },
      filters: [{ name: "levelGate" }],
      listeners: [{ url: "wss://l.example.com", tracks: "both" }],
      fallback: { app: "b" }
    });
    const speech = appFromRow({
      ref: "s",
      url: "wss://bot.example.com",
      signingSecret: "s",
      speechVoice: "deepgram/aura-2-thalia-en",
      speechSttModel: "deepgram/nova-3",
      speechSettings: { hints: ["Fonoster", 7] }
    })!.speech;
    expect(speech).to.deep.equal({
      voice: "deepgram/aura-2-thalia-en",
      language: "en-US",
      sttModel: "deepgram/nova-3",
      hints: ["Fonoster"]
    });
  });

  it("appFromRow: reads patience and the recording policy (CP-B1)", function () {
    const app = appFromRow({
      ref: "a",
      accessKeyId: "WO1",
      url: "wss://bot.example.com",
      signingSecret: "s",
      patience: "high",
      recording: "consent"
    });
    expect(app?.speech.patience).to.equal("high");
    expect(app?.recording).to.equal("consent");
    const bad = appFromRow({
      ref: "b",
      url: "wss://bot.example.com",
      signingSecret: "s",
      patience: "eager",
      recording: "maybe"
    });
    expect(bad?.speech.patience).to.be.undefined;
    expect(bad?.recording).to.be.undefined;
  });

  it("appFromRow: reads the amd columns (AO-B1)", function () {
    const row = {
      ref: "a",
      url: "wss://bot.example.com",
      signingSecret: "s"
    };
    expect(appFromRow({ ...row, amd: false })?.amd).to.be.undefined;
    expect(appFromRow({ ...row, amd: true })?.amd).to.equal(true);
    expect(
      appFromRow({ ...row, amd: true, amdWindowMs: 2500 })?.amd
    ).to.deep.equal({ windowMs: 2500 });
  });

  it("config: database features need a database URL", function () {
    const base: GatewayConfig = {
      nats: { url: "nats://x" },
      providers: {},
      appStore: { source: "database" },
      webhooks: { enabled: true }
    };
    expect(validateConfig(base).join()).to.match(/need database.url/);
    expect(
      validateConfig({ ...base, database: { url: "postgres://x" } })
    ).to.deep.equal([]);
  });

  describe("with a database", function () {
    let db: TestDb;
    let key: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let encrypted: any;

    before(async function () {
      if (!testDatabaseUrl()) return this.skip();
      this.timeout(120_000);
      db = (await createTestDb())!;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      key = require("@47ng/cloak").generateKey();
      encrypted = RegistryNs.openPrismaClient({
        url: db.url,
        encryptionKey: key,
        clientModule: CLIENT
      });
      await encrypted.application.create({
        data: {
          ref: "support",
          accessKeyId: "WO1",
          name: "Support line",
          type: "EXTERNAL",
          endpoint: "",
          url: "wss://bot.example.com/agent",
          protocol: "fonoster",
          signingSecret: "app-secret",
          speechVoice: "fake/default",
          speechLanguage: "en-US"
        }
      });
      await db.prisma.application.create({
        data: {
          ref: "old",
          accessKeyId: "WO1",
          name: "legacy",
          type: "EXTERNAL",
          endpoint: "localhost:50061"
        }
      });
    });
    after(async () => {
      await encrypted?.$disconnect();
      await db?.drop();
    });

    it("stores the signing secret encrypted and serves the app from the database", async function () {
      const [raw] = await db.prisma.$queryRawUnsafe(
        `select signing_secret_hash from applications where ref = 'support'`
      );
      expect(raw.signing_secret_hash).to.not.include("app-secret");
      const store = await PrismaAppStore.open(encrypted, { cacheMs: 0 });
      expect(store.count()).to.equal(1);
      expect(store.find("support")).to.include({
        url: "wss://bot.example.com/agent",
        signingSecret: "app-secret",
        workspaceRef: "WO1"
      });
      expect(store.find("old")).to.be.undefined;
      expect(store.forNumber()).to.be.undefined;
    });

    it("picks up changes within the cache window", async function () {
      const store = await PrismaAppStore.open(encrypted, { cacheMs: 50 });
      try {
        await encrypted.application.update({
          where: { ref: "support" },
          data: { speechLanguage: "es-419" }
        });
        await sleep(200);
        expect(store.find("support")!.speech.language).to.equal("es-419");
      } finally {
        store.stop();
        await encrypted.application.update({
          where: { ref: "support" },
          data: { speechLanguage: "en-US" }
        });
      }
    });

    describe("gateway end to end", function () {
      this.timeout(20_000);
      let nc: NatsConnection;
      let harness: FakesHarness;
      let receiver: FakeWebhookReceiver;
      let gateway: Gateway;

      before(async function () {
        if (!process.env.CONFORMANCE_NATS_URL) return this.skip();
        nc = await connect({ servers: process.env.CONFORMANCE_NATS_URL });
      });
      after(async () => nc?.close());
      afterEach(async () => {
        await gateway?.stop();
        await harness?.stop();
        await receiver?.stop();
      });

      it("routes a call to a database app and delivers call.started from the database endpoint", async function () {
        harness = await new FakesHarness().start();
        harness.mediaNode.attachNats(nc);
        receiver = await new FakeWebhookReceiver().start();
        await encrypted.application.update({
          where: { ref: "support" },
          data: { url: harness.app.url }
        });
        const hooks = await Webhooks.PrismaWebhookStore.open(encrypted);
        new Webhooks.WebhookDispatcher({
          store: hooks,
          allowInsecureUrls: true,
          allowedDestinations: ["127.0.0.1"]
        }).createEndpoint({
          workspaceRef: "WO1",
          url: receiver.url,
          events: ["call.started"]
        });
        await hooks.flush();

        const apps = await PrismaAppStore.open(encrypted, { cacheMs: 0 });
        const store = await Webhooks.PrismaWebhookStore.open(encrypted);
        // The fake receiver is local; private destinations are refused unless allowed (RV-B2).
        const dispatcher = new Webhooks.WebhookDispatcher({
          store,
          allowInsecureUrls: true,
          allowedDestinations: ["127.0.0.1"]
        });
        const urls = harness.providerUrls;
        gateway = await new Gateway({
          config: {
            nats: { url: process.env.CONFORMANCE_NATS_URL! },
            testMode: true,
            providers: {
              fake: {
                adapter: "fake",
                capabilities: ["tts", "stt"],
                tts: { url: urls.tts },
                stt: { url: urls.stt }
              }
            }
          },
          nats: nc,
          apps,
          webhooks: (e) => dispatcher.publish(e)
        }).start();

        harness.app.configure({
          signingSecret: "app-secret",
          verifySignature: true
        });
        harness.mediaNode.offerCall({ appRef: "support" });
        const { peer } = await harness.app.nextConnection();
        const json = (p: Peer) =>
          p.frames.items
            .filter((f) => f.kind === "json")
            .map((f) => f.data as Record<string, unknown>);
        for (let i = 0; i < 100; i++) {
          if (json(peer).some((m) => m.type === "session.start")) break;
          await sleep(30);
        }
        expect(json(peer).map((m) => m.type)).to.include("session.start");
        await dispatcher.runDue();
        await store.flush();
        expect(receiver.received).to.have.length(1);
        expect(receiver.received[0].json).to.include({
          type: "call.started",
          workspaceRef: "WO1"
        });
        const log = await store.loadDeliveries({ workspaceRef: "WO1" });
        expect(log[0]).to.include({ status: "succeeded" });
      });
    });
  });
});
