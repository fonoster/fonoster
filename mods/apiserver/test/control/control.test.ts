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
import * as http from "http";
import { AddressInfo } from "net";
import { Registry, Webhooks } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import { struct } from "pb-util";
import {
  createTestDb,
  TestDb,
  testDatabaseUrl
} from "../../../common/test/persistence/testDb";
import { createCreateApplication } from "../../src/applications/createCreateApplication";
import { createDeleteApplication } from "../../src/applications/createDeleteApplication";
import { createGetApplication } from "../../src/applications/createGetApplication";
import { createListApplications } from "../../src/applications/createListApplications";
import { createRotateSigningSecret } from "../../src/applications/createRotateSigningSecret";
import { createUpdateApplication } from "../../src/applications/createUpdateApplication";
import { getConfig } from "../../src/config";
import { createProvidersHandlers } from "../../src/providers";
import { createWebhooksHandlers } from "../../src/webhooks";
import { PrismaAssistantSource } from "../../../autopilot/src/session/hosted";
import { TEST_TOKEN } from "../utils";

// The control-plane APIs (rebuild: control) against a throwaway Postgres
// (PERSISTENCE_TEST_DATABASE_URL); skipped without one.

/** A workspace the test token can access, and one it cannot. */
const WS = "GRahn02s8tgdfghz72vb0fz538qpb5z35p";
const OTHER = "WOother000000000000000000000000000";

const CONFIG = { autopilotUrl: "ws://autopilot:50061" };

type Handler = (
  call: unknown,
  callback: (err: unknown, res?: unknown) => void
) => Promise<void> | void;

function invoke<T = Record<string, unknown>>(
  handler: Handler,
  request: unknown,
  accessKeyId = WS
): Promise<T> {
  const metadata = new grpc.Metadata();
  metadata.set("token", TEST_TOKEN);
  metadata.set("accessKeyId", accessKeyId);
  return new Promise((resolve, reject) => {
    void handler({ metadata, request }, (err, res) =>
      err ? reject(err) : resolve(res as T)
    );
  });
}

const ASSISTANT = {
  conversationSettings: {
    firstMessage: "Hi, this is Ada.",
    systemPrompt: "You are a helpful receptionist.",
    goodbyeMessage: "Bye!",
    systemErrorMessage: "Sorry, something went wrong."
  },
  languageModel: { model: "openai/gpt-4o-mini" }
};

describe("@control: applications, webhooks and provider keys (database)", function () {
  this.timeout(120_000);
  let db: TestDb;

  before(async function () {
    if (!testDatabaseUrl()) return this.skip();
    db = (await createTestDb())!;
    await db.prisma.product.create({
      data: { ref: "llm.openai", name: "OpenAI", vendor: "OPENAI", type: "LLM" }
    });
  });

  after(async function () {
    await db?.drop();
  });

  describe("applications (session app model)", function () {
    let appRef: string;
    let secret: string;

    it("creates a session app and shows its secret once", async function () {
      const res = await invoke<{
        ref: string;
        signingSecret: string;
        signingSecretHint: string;
      }>(createCreateApplication(db.prisma, CONFIG), {
        name: "Support bot",
        type: "STREAM",
        url: "wss://bot.example.com/session",
        protocol: "twilio",
        speech: { voice: "elevenlabs/rachel", language: "es-419" },
        listeners: [{ url: "wss://qa.example.com/listen", tracks: "inbound" }],
        recording: "consent",
        fallbackMessage: "We are having trouble, call back later."
      });
      expect(res.signingSecret).to.have.length.greaterThan(30);
      expect(res.signingSecretHint).to.equal(`…${res.signingSecret.slice(-4)}`);
      appRef = res.ref;
      secret = res.signingSecret;

      const row = await db.prisma.application.findUnique({
        where: { ref: appRef }
      });
      expect(row).to.include({
        accessKeyId: WS,
        url: "wss://bot.example.com/session",
        protocol: "twilio",
        signingSecret: secret,
        speechVoice: "elevenlabs/rachel",
        speechLanguage: "es-419",
        recording: "consent",
        endpoint: "wss://bot.example.com/session"
      });
      // Twilio protocol: the audio format is Twilio's, not stored.
      expect(row.audio).to.equal(null);
    });

    it("reads an app back without its secret", async function () {
      const app = await invoke(createGetApplication(db.prisma), {
        ref: appRef
      });
      expect(app).to.not.have.property("signingSecret");
      expect(app.signingSecretHint).to.equal(`…${secret.slice(-4)}`);
      expect(app.speech).to.include({
        voice: "elevenlabs/rachel",
        language: "es-419"
      });
      expect(app.listeners).to.deep.equal([
        { url: "wss://qa.example.com/listen", tracks: "inbound" }
      ]);
      expect(app.recording).to.equal("consent");
      expect(app.amd).to.deep.equal({ enabled: false, windowMs: 0 });
    });

    it("rejects invalid apps with clear messages", async function () {
      const create = createCreateApplication(db.prisma, CONFIG);
      const cases: [Record<string, unknown>, RegExp][] = [
        [{ name: "x", url: "https://bot.example.com" }, /ws:\/\/ or wss:\/\//],
        [{ name: "x" }, /url is required/],
        [
          {
            name: "x",
            url: "wss://a.example.com",
            speech: { voice: "rachel" }
          },
          /catalog id/
        ],
        [
          {
            name: "x",
            url: "wss://a.example.com",
            audio: { codec: "pcmu", rate: 16000 }
          },
          /pcmu audio is 8000 Hz only/
        ],
        [
          {
            name: "x",
            url: "wss://a.example.com",
            fallbackAppRef: "00000000-0000-0000-0000-000000000000"
          },
          /no such app/
        ],
        [
          {
            name: "x",
            url: "wss://a.example.com",
            listeners: Array(5).fill({ url: "wss://l.example.com" })
          },
          /at most 4 listeners/
        ]
      ];
      for (const [request, message] of cases) {
        const err = (await invoke(create, request).catch((e) => e)) as {
          code: number;
          message: string;
        };
        expect(err.code, JSON.stringify(request)).to.equal(
          grpc.status.INVALID_ARGUMENT
        );
        expect(err.message).to.match(message);
      }
    });

    it("creates an Autopilot app on the hosted Autopilot URL with its assistant", async function () {
      const res = await invoke<{ ref: string }>(
        createCreateApplication(db.prisma, CONFIG),
        {
          name: "Receptionist",
          type: "AUTOPILOT",
          intelligence: { config: struct.encode(ASSISTANT) },
          speech: { patience: "high" },
          amd: { enabled: true, windowMs: 3000 }
        }
      );
      const row = await db.prisma.application.findUnique({
        where: { ref: res.ref },
        include: { intelligence: true }
      });
      expect(row.url).to.equal(CONFIG.autopilotUrl);
      expect(row.protocol).to.equal("fonoster");
      expect(row.patience).to.equal("high");
      expect(row).to.include({ amd: true, amdWindowMs: 3000 });
      expect(row.intelligence.productRef).to.equal("llm.openai");
      expect(row.intelligence.config).to.deep.equal(ASSISTANT);

      const app = await invoke(createGetApplication(db.prisma), {
        ref: res.ref
      });
      expect(struct.decode(app.intelligence.config)).to.deep.equal(ASSISTANT);
      // The hosted Autopilot loads it from the same row (CP-B11).
      expect(
        await new PrismaAssistantSource(db.prisma).get(res.ref)
      ).to.deep.equal({ assistant: ASSISTANT, workspaceRef: WS });

      const bad = await invoke(createCreateApplication(db.prisma, CONFIG), {
        name: "Bad",
        type: "AUTOPILOT",
        intelligence: {
          config: struct.encode({
            ...ASSISTANT,
            languageModel: { provider: "openai", model: "gpt-4o" }
          })
        }
      }).catch((e) => e);
      expect(bad.message).to.match(/invalid agent/);
    });

    it("takes any catalog provider's model, and refuses one the catalog lacks", async function () {
      const create = (model: string) =>
        invoke<{ ref: string }>(createCreateApplication(db.prisma, CONFIG), {
          name: `Agent on ${model}`,
          type: "AUTOPILOT",
          intelligence: {
            config: struct.encode({
              ...ASSISTANT,
              languageModel: { ...ASSISTANT.languageModel, model }
            })
          }
        });
      const res = await create("fake/llm");
      const row = await db.prisma.application.findUnique({
        where: { ref: res.ref },
        include: { intelligence: true }
      });
      expect(row.intelligence.productRef).to.equal("llm.fake");
      expect(
        await db.prisma.product.findUnique({ where: { ref: "llm.fake" } })
      ).to.include({ vendor: "GENERIC", type: "LLM" });

      // Once the catalog lists language models, the model must be one of them.
      await db.prisma.registryProvider.create({
        data: { id: "acme", adapter: "openai", capabilities: ["llm"] }
      });
      await db.prisma.registryModel.create({
        data: { id: "acme/brain-1", providerId: "acme", type: "llm" }
      });
      expect((await create("acme/brain-1")).ref).to.be.a("string");
      const missing = await create("acme/brain-2").catch((e) => e);
      expect(missing.message).to.match(/acme\/brain-2 is not in the catalog/);
      await db.prisma.registryModel.delete({ where: { id: "acme/brain-1" } });
      await db.prisma.registryProvider.delete({ where: { id: "acme" } });
    });

    it("Autopilot apps share the configured Autopilot secret", async function () {
      const config = { ...CONFIG, autopilotSigningSecret: "shared-secret-1" };
      const res = await invoke<{ ref: string; signingSecret: string }>(
        createCreateApplication(db.prisma, config),
        {
          name: "Shared",
          type: "AUTOPILOT",
          intelligence: { config: ASSISTANT }
        }
      );
      expect(res.signingSecret).to.equal("");
      const row = await db.prisma.application.findUnique({
        where: { ref: res.ref }
      });
      expect(row.signingSecret).to.equal("shared-secret-1");
      const rotate = await invoke(
        createRotateSigningSecret(db.prisma, config),
        { ref: res.ref }
      ).catch((e) => e);
      expect(rotate.code).to.equal(grpc.status.INVALID_ARGUMENT);
    });

    it("updates with PUT semantics and keeps the secret", async function () {
      await invoke(createUpdateApplication(db.prisma, CONFIG), {
        ref: appRef,
        name: "Support bot v2",
        url: "wss://bot.example.com/v2",
        speech: { voice: "deepgram/aura-2-thalia-en", silenceTimeoutMs: 1500 },
        audio: { codec: "pcm16", rate: 24000 }
      });
      const row = await db.prisma.application.findUnique({
        where: { ref: appRef }
      });
      expect(row).to.include({
        name: "Support bot v2",
        url: "wss://bot.example.com/v2",
        protocol: "fonoster",
        speechVoice: "deepgram/aura-2-thalia-en",
        speechLanguage: "en-US",
        silenceTimeoutMs: 1500,
        signingSecret: secret
      });
      expect(row.audio).to.deep.equal({ codec: "pcm16", rate: 24000 });
      // Left out: back to defaults.
      expect(row.listeners).to.equal(null);
      expect(row.recording).to.equal(null);
      expect(row.fallbackMessage).to.equal(null);
    });

    it("rotates the signing secret with no overlap", async function () {
      const res = await invoke<{ signingSecret: string }>(
        createRotateSigningSecret(db.prisma, CONFIG),
        { ref: appRef }
      );
      expect(res.signingSecret).to.not.equal(secret);
      const row = await db.prisma.application.findUnique({
        where: { ref: appRef }
      });
      expect(row.signingSecret).to.equal(res.signingSecret);
    });

    it("checks fallback apps and catalog ids", async function () {
      const other = await invoke<{ ref: string }>(
        createCreateApplication(db.prisma, CONFIG),
        {
          name: "Fallback",
          url: "wss://fallback.example.com",
          fallbackAppRef: appRef
        }
      );
      expect(other.ref).to.be.a("string");
      const self = await invoke(createUpdateApplication(db.prisma, CONFIG), {
        ref: other.ref,
        url: "wss://fallback.example.com",
        fallbackAppRef: other.ref
      }).catch((e) => e);
      expect(self.message).to.match(/own fallback/);

      await db.prisma.registryVoice.create({
        data: { id: "elevenlabs/rachel", providerId: "elevenlabs" }
      });
      await db.prisma.registryVoice.create({
        data: {
          id: "elevenlabs/old",
          providerId: "elevenlabs",
          state: "RETIRED",
          replacement: "elevenlabs/rachel"
        }
      });
      const create = createCreateApplication(db.prisma, CONFIG);
      const unknown = await invoke(create, {
        name: "x",
        url: "wss://a.example.com",
        speech: { voice: "elevenlabs/nobody" }
      }).catch((e) => e);
      expect(unknown.message).to.match(/not in the catalog/);
      const retired = await invoke(create, {
        name: "x",
        url: "wss://a.example.com",
        speech: { voice: "elevenlabs/old" }
      }).catch((e) => e);
      expect(retired.message).to.match(/retired; use elevenlabs\/rachel/);
      await invoke(create, {
        name: "ok",
        url: "wss://a.example.com",
        speech: { voice: "elevenlabs/rachel" }
      });
      await db.prisma.registryVoice.deleteMany({});
    });

    it("lists the workspace's apps, newest first", async function () {
      const res = await invoke<{ items: { name: string }[] }>(
        createListApplications(db.prisma),
        { pageSize: 50 }
      );
      expect(res.items.length).to.be.greaterThan(3);
      expect(res.items[0].name).to.equal("ok");
      const none = await invoke<{ items: unknown[] }>(
        createListApplications(db.prisma),
        { pageSize: 50 },
        OTHER
      );
      expect(none.items).to.deep.equal([]);
    });

    it("refuses another workspace's app", async function () {
      const foreign = await db.prisma.application.create({
        data: {
          accessKeyId: OTHER,
          name: "theirs",
          type: "STREAM",
          endpoint: "wss://x.example.com",
          url: "wss://x.example.com",
          signingSecret: "theirs"
        }
      });
      for (const handler of [
        createRotateSigningSecret(db.prisma, CONFIG),
        createGetApplication(db.prisma),
        createUpdateApplication(db.prisma, CONFIG)
      ]) {
        const err = await invoke(handler, {
          ref: foreign.ref,
          name: "mine now",
          url: "wss://evil.example.com"
        }).catch((e) => e);
        expect(err.code).to.equal(grpc.status.PERMISSION_DENIED);
      }
      const row = await db.prisma.application.findUnique({
        where: { ref: foreign.ref }
      });
      expect(row).to.include({ signingSecret: "theirs", name: "theirs" });
      await db.prisma.application.delete({ where: { ref: foreign.ref } });
    });

    it("deletes an app", async function () {
      const res = await invoke<{ ref: string }>(
        createCreateApplication(db.prisma, CONFIG),
        { name: "temp", url: "wss://t.example.com" }
      );
      await invoke(createDeleteApplication(db.prisma), { ref: res.ref });
      expect(
        await db.prisma.application.findUnique({ where: { ref: res.ref } })
      ).to.equal(null);
    });
  });

  describe("webhooks", function () {
    let ref: string;
    let firstSecret: string;
    const now = Date.parse("2026-10-15T08:00:00Z");
    const handlers = () =>
      createWebhooksHandlers(db.prisma, {
        allowInsecureUrls: true,
        allowedDestinations: ["127.0.0.1"],
        now: () => now
      });

    it("creates an endpoint (HTTPS, known events) and shows the secret once", async function () {
      const strict = createWebhooksHandlers(db.prisma);
      const insecure = await invoke(strict.createWebhook, {
        url: "http://hooks.example.com",
        events: ["call.ended"]
      }).catch((e) => e);
      expect(insecure.message).to.match(/HTTPS/);
      const unknown = await invoke(strict.createWebhook, {
        url: "https://hooks.example.com",
        events: ["call.exploded"]
      }).catch((e) => e);
      expect(unknown.message).to.match(/unknown event types/);

      const res = await invoke<{ ref: string; secret: string }>(
        strict.createWebhook,
        {
          url: "https://hooks.example.com/fonoster",
          events: ["call.ended", "call_record.sealed"]
        }
      );
      expect(res.secret).to.match(/^whsec_/);
      ref = res.ref;
      firstSecret = res.secret;
    });

    it("lists and gets endpoints without their secrets", async function () {
      const list = await invoke<{ items: Record<string, unknown>[] }>(
        handlers().listWebhooks,
        {}
      );
      expect(list.items).to.have.length(1);
      expect(list.items[0]).to.include({
        ref,
        url: "https://hooks.example.com/fonoster",
        secretHint: `…${firstSecret.slice(-4)}`
      });
      expect(list.items[0]).to.not.have.property("secret");
      const other = await invoke<{ items: unknown[] }>(
        handlers().listWebhooks,
        {},
        OTHER
      );
      expect(other.items).to.deep.equal([]);
      const missing = await invoke(handlers().getWebhook, { ref }, OTHER).catch(
        (e) => e
      );
      expect(missing.code).to.equal(grpc.status.NOT_FOUND);
    });

    it("updates the URL or events", async function () {
      await invoke(handlers().updateWebhook, {
        ref,
        events: ["call.started"]
      });
      const got = await invoke(handlers().getWebhook, { ref });
      expect(got.events).to.deep.equal(["call.started"]);
      expect(got.url).to.equal("https://hooks.example.com/fonoster");
    });

    it("rotates the secret; the previous one verifies for 24 hours", async function () {
      const res = await invoke<{
        secret: string;
        previousSecretUntil: number;
      }>(handlers().rotateWebhookSecret, { ref });
      expect(res.secret).to.not.equal(firstSecret);
      expect(res.previousSecretUntil).to.equal(now / 1000 + 24 * 3600);
      const row = await db.prisma.webhookEndpoint.findUnique({
        where: { ref }
      });
      expect(row.previousSecret).to.equal(firstSecret);
      expect(row.secret).to.equal(res.secret);
    });

    it("lists deliveries and resends one", async function () {
      const received: string[] = [];
      const server = http.createServer((req, res) => {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          received.push(body);
          res.writeHead(200).end();
        });
      });
      await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
      const port = (server.address() as AddressInfo).port;
      try {
        const created = await invoke<{ ref: string }>(
          handlers().createWebhook,
          { url: `http://127.0.0.1:${port}/hook`, events: ["call.ended"] }
        );
        await db.prisma.webhookDelivery.create({
          data: {
            ref: "whd_test1",
            endpointRef: created.ref,
            accessKeyId: WS,
            eventId: "evt_1",
            eventType: "call.ended",
            event: Webhooks.callEnded(WS, {
              callRef: "c1",
              from: "+1",
              to: "+2",
              direction: "inbound",
              durationSeconds: 3,
              endReason: "hangup"
            } as never),
            status: "failed",
            attempts: 3,
            lastStatus: 500,
            nextAttemptAt: new Date(now)
          }
        });
        const list = await invoke<{ items: Record<string, unknown>[] }>(
          handlers().listWebhookDeliveries,
          { webhookRef: created.ref }
        );
        expect(list.items).to.have.length(1);
        expect(list.items[0]).to.include({
          ref: "whd_test1",
          status: "failed",
          lastStatus: 500
        });
        const resent = await invoke<Record<string, unknown>>(
          handlers().resendWebhookDelivery,
          { ref: "whd_test1" }
        );
        expect(resent).to.include({ status: "succeeded", lastStatus: 200 });
        expect(received).to.have.length(1);
        expect(JSON.parse(received[0]).type).to.equal("call.ended");
        const elsewhere = await invoke(
          handlers().resendWebhookDelivery,
          { ref: "whd_test1" },
          OTHER
        ).catch((e) => e);
        expect(elsewhere.code).to.equal(grpc.status.NOT_FOUND);
      } finally {
        server.close();
      }
    });

    it("deletes an endpoint", async function () {
      await invoke(handlers().deleteWebhook, { ref });
      const err = await invoke(handlers().getWebhook, { ref }).catch((e) => e);
      expect(err.code).to.equal(grpc.status.NOT_FOUND);
    });
  });

  describe("provider catalog and workspace keys", function () {
    before(async function () {
      const p = db.prisma;
      await p.registryProvider.create({
        data: {
          id: "deepgram",
          adapter: "deepgram",
          capabilities: ["stt", "tts"],
          credentialRef: "deepgram-default"
        }
      });
      await p.registryProvider.create({
        data: {
          id: "gone",
          adapter: "gone",
          capabilities: ["tts"],
          credentialRef: "gone",
          state: "RETIRED"
        }
      });
      await p.registryModel.create({
        data: {
          id: "deepgram/nova-3",
          providerId: "deepgram",
          type: "stt",
          languages: ["en-US", "es-419"],
          features: ["streaming"]
        }
      });
      await p.registryModel.create({
        data: {
          id: "deepgram/aura-2",
          providerId: "deepgram",
          type: "tts",
          state: "DEPRECATED",
          replacement: "deepgram/aura-3",
          retireOn: "2027-01-01"
        }
      });
      await p.registryVoice.create({
        data: {
          id: "deepgram/aura-2-thalia-en",
          providerId: "deepgram",
          language: "en-US",
          models: { create: [{ modelId: "deepgram/aura-2" }] }
        }
      });
      await p.registryVoice.create({
        data: {
          id: "deepgram/custom-other",
          providerId: "deepgram",
          ownerWorkspace: OTHER
        }
      });
    });

    it("lists the catalog without retired items or other workspaces' voices", async function () {
      const { listCatalog } = createProvidersHandlers(db.prisma);
      const all = await invoke<{ items: Record<string, unknown>[] }>(
        listCatalog,
        {}
      );
      const ids = all.items.map((i) => i.id);
      expect(ids).to.include.members([
        "deepgram",
        "deepgram/nova-3",
        "deepgram/aura-2",
        "deepgram/aura-2-thalia-en"
      ]);
      expect(ids).to.not.include("gone");
      expect(ids).to.not.include("deepgram/custom-other");
      const voice = all.items.find((i) => i.id === "deepgram/aura-2-thalia-en");
      expect(voice).to.deep.include({
        kind: "voice",
        state: "active",
        models: ["deepgram/aura-2"],
        languages: ["en-US"]
      });
      const deprecated = all.items.find((i) => i.id === "deepgram/aura-2");
      expect(deprecated).to.include({
        state: "deprecated",
        replacement: "deepgram/aura-3"
      });
      const stt = await invoke<{ items: Record<string, unknown>[] }>(
        listCatalog,
        { kind: "model", type: "stt" }
      );
      expect(stt.items.map((i) => i.id)).to.deep.equal(["deepgram/nova-3"]);
    });

    it("stores a key as a Secret, replaces it, lists and deletes it", async function () {
      const h = createProvidersHandlers(db.prisma);
      const unknown = await invoke(h.setProviderKey, {
        providerId: "nobody",
        key: "k"
      }).catch((e) => e);
      expect(unknown.message).to.match(/not in the catalog/);
      const retired = await invoke(h.setProviderKey, {
        providerId: "gone",
        key: "k"
      }).catch((e) => e);
      expect(retired.message).to.match(/retired/);

      const key = await invoke<Record<string, string>>(h.setProviderKey, {
        providerId: "deepgram",
        key: "dg-key-1"
      });
      expect(key).to.not.have.property("key");
      const secret = await db.prisma.secret.findUnique({
        where: { ref: key.secretRef }
      });
      expect(secret).to.include({
        accessKeyId: WS,
        name: "provider-key/deepgram",
        secret: "dg-key-1"
      });

      const again = await invoke<Record<string, string>>(h.setProviderKey, {
        providerId: "deepgram",
        key: "dg-key-2"
      });
      expect(again.secretRef).to.equal(key.secretRef);
      expect(
        (
          await db.prisma.secret.findUnique({
            where: { ref: key.secretRef }
          })
        ).secret
      ).to.equal("dg-key-2");

      const list = await invoke<{ items: Record<string, unknown>[] }>(
        h.listProviderKeys,
        {}
      );
      expect(list.items.map((i) => i.providerId)).to.deep.equal(["deepgram"]);
      const other = await invoke<{ items: unknown[] }>(
        h.listProviderKeys,
        {},
        OTHER
      );
      expect(other.items).to.deep.equal([]);

      // What the gateway and the hosted Autopilot read back (CP-B11, CP-B12).
      const keys = new Registry.PrismaWorkspaceKeys(db.prisma);
      expect(await keys.get(WS, "deepgram")).to.equal("dg-key-2");
      expect(await keys.get(OTHER, "deepgram")).to.equal(undefined);
      expect(
        await keys.forCredentialRef(WS, "deepgram-default", [
          { id: "deepgram", credentialRef: "deepgram-default" }
        ])
      ).to.equal("dg-key-2");

      await invoke(h.deleteProviderKey, { providerId: "deepgram" });
      expect(await db.prisma.workspaceProviderKey.count()).to.equal(0);
      expect(
        await db.prisma.secret.findUnique({ where: { ref: key.secretRef } })
      ).to.equal(null);
      const gone = await invoke(h.deleteProviderKey, {
        providerId: "deepgram"
      }).catch((e) => e);
      expect(gone.code).to.equal(grpc.status.NOT_FOUND);
    });
  });

  it("serves ListCalls from the call-record index by default", function () {
    expect(getConfig().callRecords.listCallsFromIndex).to.equal(true);
  });
});
