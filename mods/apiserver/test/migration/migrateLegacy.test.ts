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
import { sessionAssistantSchema } from "@fonoster/common";
import {
  createTestDb,
  TestDb,
  testDatabaseUrl
} from "../../../common/test/persistence/testDb";
import { migrateLegacy, optionsFromArgv } from "../../src/migration";
import { PrismaAssistantSource } from "../../../autopilot/src/session/hosted";

// fonoster-migrate-legacy against a throwaway Postgres (PERSISTENCE_TEST_DATABASE_URL); skipped
// without one.

const WS = "WSmigrate00000000000000000000000001";
const AUTOPILOT_URL = "wss://autopilot.example.com/session";

const legacyAssistant = (overrides: Record<string, unknown> = {}) => ({
  conversationSettings: {
    firstMessage: "Hello, this is Ada.",
    systemPrompt: "You are a receptionist.",
    goodbyeMessage: "Bye.",
    systemErrorMessage: "Sorry, something went wrong.",
    maxSpeechWaitTimeout: 600,
    vad: {
      activationThreshold: 0.6,
      deactivationThreshold: 0.25,
      debounceFrames: 4
    }
  },
  languageModel: {
    provider: "openai",
    model: "gpt-4o-mini",
    apiKey: "sk-test-inline-key",
    temperature: 0.2,
    maxTokens: 250,
    tools: []
  },
  eventsHook: { url: "https://hooks.example.com/conv", events: ["all"] },
  audioFilters: [{ name: "levelGate", options: {} }],
  ...overrides
});

async function app(
  db: TestDb,
  ref: string,
  type: "AUTOPILOT" | "EXTERNAL",
  extra: Record<string, unknown> = {}
) {
  await db.prisma.application.create({
    data: {
      ref,
      accessKeyId: WS,
      name: ref,
      type,
      endpoint:
        type === "EXTERNAL" ? "voice.example.com:50061" : "autopilot:50061",
      ...extra
    }
  });
}

describe("@migration: fonoster-migrate-legacy (database)", function () {
  this.timeout(120_000);
  let db: TestDb;

  before(async function () {
    if (!testDatabaseUrl()) return this.skip();
    db = (await createTestDb())!;
    await db.prisma.product.create({
      data: { ref: "llm.openai", name: "OpenAI", vendor: "OPENAI", type: "LLM" }
    });
    await app(db, "ap-legacy", "AUTOPILOT", {
      intelligence: {
        create: { productRef: "llm.openai", config: legacyAssistant() }
      }
    });
    await app(db, "ap-broken", "AUTOPILOT", {
      intelligence: {
        create: {
          productRef: "llm.openai",
          config: legacyAssistant({
            languageModel: { provider: "mystery", model: "x" }
          })
        }
      }
    });
    await db.prisma.product.createMany({
      data: [
        {
          ref: "tts.elevenlabs",
          name: "ElevenLabs",
          vendor: "ELEVEN_LABS",
          type: "TTS"
        },
        {
          ref: "stt.deepgram",
          name: "Deepgram",
          vendor: "DEEPGRAM",
          type: "STT"
        },
        { ref: "tts.polly", name: "Polly", vendor: "AMAZON", type: "TTS" }
      ]
    });
    await app(db, "ext-1", "EXTERNAL", {
      textToSpeech: {
        create: {
          productRef: "tts.elevenlabs",
          config: { voice: "21m00Tcm4TlvDq8ikWAM", languageCode: "es-419" },
          credentials: JSON.stringify({ apiKey: "el-app-key" })
        }
      },
      speechToText: {
        create: {
          productRef: "stt.deepgram",
          config: { model: "nova-2", languageCode: "es-419" },
          credentials: JSON.stringify({ apiKey: "dg-app-key" })
        }
      }
    });
  });

  after(async function () {
    await db?.drop();
  });

  const options = () =>
    optionsFromArgv(
      [
        "--apply",
        "--autopilot-url",
        AUTOPILOT_URL,
        "--autopilot-secret-env",
        "HOSTED_SECRET"
      ],
      { HOSTED_SECRET: "hosted-autopilot-secret" }
    );

  it("a dry run reports the plan and writes nothing", async function () {
    const report = await migrateLegacy(db.prisma, {
      ...options(),
      dryRun: true
    });
    const assistants = report.steps.find((s) => s.step === "assistants")!;
    expect(assistants.changed).to.deep.equal(["ap-legacy"]);
    expect(assistants.skipped).to.deep.equal(["ap-broken"]);
    const row = await db.prisma.intelligence.findUnique({
      where: { applicationRef: "ap-legacy" }
    });
    expect(row.config.languageModel.provider).to.equal("openai");
    expect(await db.prisma.secret.count()).to.equal(0);
    expect(await db.prisma.webhookEndpoint.count()).to.equal(0);
  });

  it("converts stored assistants, moves keys and webhooks, re-points Autopilot apps", async function () {
    const report = await migrateLegacy(db.prisma, options());
    const assistants = report.steps.find((s) => s.step === "assistants")!;
    expect(assistants.changed).to.deep.equal(["ap-legacy"]);
    expect(assistants.skipped).to.deep.equal(["ap-broken"]);
    expect(
      assistants.notices.some(
        (n) => n.ref === "ap-broken" && n.level === "action"
      )
    ).to.be.true;

    const row = await db.prisma.intelligence.findUnique({
      where: { applicationRef: "ap-legacy" }
    });
    const assistant = sessionAssistantSchema.parse(row.config);
    expect(assistant.languageModel.model).to.equal("openai/gpt-4o-mini");
    expect(assistant.conversationSettings.patience).to.equal("high");
    expect(JSON.stringify(row.config)).to.not.contain("sk-test-inline-key");

    // The inline key is the workspace's openai key, where the credentialRef lookup reads it.
    const binding = await db.prisma.workspaceProviderKey.findUnique({
      where: {
        accessKeyId_providerId: { accessKeyId: WS, providerId: "openai" }
      }
    });
    const secret = await db.prisma.secret.findUnique({
      where: { ref: binding.secretRef }
    });
    expect(secret).to.include({
      name: "provider-key/openai",
      secret: "sk-test-inline-key",
      accessKeyId: WS
    });

    const hooks = await db.prisma.webhookEndpoint.findMany({
      where: { accessKeyId: WS }
    });
    expect(hooks).to.have.length(1);
    expect(hooks[0].url).to.equal("https://hooks.example.com/conv");
    expect(hooks[0].events).to.deep.equal([
      "call.started",
      "call.ended",
      "call_record.sealed"
    ]);

    const migratedApp = await db.prisma.application.findUnique({
      where: { ref: "ap-legacy" }
    });
    expect(migratedApp).to.include({
      url: AUTOPILOT_URL,
      flavor: "native",
      signingSecret: "hosted-autopilot-secret"
    });
    expect(migratedApp.filters).to.deep.equal([
      { name: "levelGate", options: {} }
    ]);

    const notices = await db.prisma.registryNotice.findMany({
      where: { accessKeyId: WS, type: "legacy.migrated" }
    });
    expect(notices.length).to.be.greaterThan(2);

    // The hosted Autopilot reads the converted assistant by appRef.
    const loaded = await new PrismaAssistantSource(db.prisma).get("ap-legacy");
    expect(loaded?.workspaceRef).to.equal(WS);
    expect(
      sessionAssistantSchema.safeParse(loaded?.assistant).success
    ).to.equal(true);
  });

  it("seeds the catalog from products and raw names, and moves app credentials to vendor keys", async function () {
    const providers = await db.prisma.registryProvider.findMany({
      orderBy: { id: "asc" }
    });
    expect(
      providers.map((p: { id: string; credentialRef: string }) => [
        p.id,
        p.credentialRef
      ])
    ).to.deep.equal([
      ["deepgram", "deepgram-default"],
      ["elevenlabs", "elevenlabs-default"],
      ["openai", "openai-default"]
    ]);
    const models = await db.prisma.registryModel.findMany({
      orderBy: { id: "asc" }
    });
    expect(
      models.map((m: { id: string; type: string }) => [m.id, m.type])
    ).to.deep.equal([
      ["deepgram/nova-2", "stt"],
      ["elevenlabs/eleven_flash_v2_5", "tts"],
      ["openai/gpt-4o-mini", "llm"]
    ]);
    const voice = await db.prisma.registryVoice.findUnique({
      where: { id: "elevenlabs/21m00Tcm4TlvDq8ikWAM" },
      include: { models: true }
    });
    expect(
      voice.models.map((m: { modelId: string }) => m.modelId)
    ).to.deep.equal(["elevenlabs/eleven_flash_v2_5"]);

    const ext = await db.prisma.application.findUnique({
      where: { ref: "ext-1" },
      include: { textToSpeech: true, speechToText: true }
    });
    expect(ext.speechVoice).to.equal("elevenlabs/21m00Tcm4TlvDq8ikWAM");
    expect(ext.textToSpeech.credentials).to.equal(null);
    expect(ext.speechToText.credentials).to.equal(null);
    const keys = await db.prisma.workspaceProviderKey.findMany({
      where: { accessKeyId: WS },
      include: { secret: true },
      orderBy: { providerId: "asc" }
    });
    expect(
      keys.map((k: { providerId: string; secret: { secret: string } }) => [
        k.providerId,
        k.secret.secret
      ])
    ).to.deep.equal([
      ["deepgram", "dg-app-key"],
      ["elevenlabs", "el-app-key"],
      ["openai", "sk-test-inline-key"]
    ]);
  });

  it("is idempotent: a second run changes nothing", async function () {
    const before = {
      secrets: await db.prisma.secret.count(),
      hooks: await db.prisma.webhookEndpoint.count(),
      notices: await db.prisma.registryNotice.count(),
      app: await db.prisma.application.findUnique({ where: { ref: "ext-1" } })
    };
    const report = await migrateLegacy(db.prisma, options());
    const assistants = report.steps.find((s) => s.step === "assistants")!;
    expect(assistants.changed).to.deep.equal([]);
    expect(assistants.unchanged).to.deep.equal(["ap-legacy"]);
    for (const step of ["catalog", "credentials"])
      expect(report.steps.find((s) => s.step === step)!.changed).to.deep.equal(
        []
      );
    expect(await db.prisma.secret.count()).to.equal(before.secrets);
    expect(await db.prisma.webhookEndpoint.count()).to.equal(before.hooks);
    expect(await db.prisma.registryNotice.count()).to.equal(before.notices);
    const ext = await db.prisma.application.findUnique({
      where: { ref: "ext-1" }
    });
    expect(ext.signingSecret).to.equal(before.app.signingSecret);
    expect(ext.speechVoice).to.equal(before.app.speechVoice);
  });

  it("keeps a workspace's own key when an assistant carried another", async function () {
    await app(db, "ap-second", "AUTOPILOT", {
      intelligence: {
        create: {
          productRef: "llm.openai",
          config: legacyAssistant({
            languageModel: {
              provider: "openai",
              model: "gpt-4o-mini",
              apiKey: "sk-other-key",
              tools: []
            },
            eventsHook: undefined
          })
        }
      }
    });
    const report = await migrateLegacy(db.prisma, options());
    const assistants = report.steps.find((s) => s.step === "assistants")!;
    expect(assistants.changed).to.deep.equal(["ap-second"]);
    expect(
      assistants.notices.some((n) =>
        /already has a different openai key/.test(n.message)
      )
    ).to.be.true;
    const secrets = await db.prisma.secret.findMany({
      where: { accessKeyId: WS, name: "provider-key/openai" }
    });
    expect(secrets.map((s: { secret: string }) => s.secret)).to.deep.equal([
      "sk-test-inline-key"
    ]);
  });
});
