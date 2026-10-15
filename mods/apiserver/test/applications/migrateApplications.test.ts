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
  convertLegacyApplication,
  InMemoryApplicationStore,
  LegacyApplication,
  migrateApplications,
  MigrationOptions,
  PrismaApplicationStore,
  toGatewayApps
} from "../../src/applications/migration";

const OPTIONS: MigrationOptions = {
  autopilotUrl: "wss://autopilot.fonoster.com/session",
  defaults: { voice: "deepgram/aura-2-thalia-en", language: "en-US" },
  newSecret: (() => {
    let n = 0;
    return () => `secret-${++n}`;
  })()
};

const external: LegacyApplication = {
  ref: "ext-1",
  accessKeyId: "WO00000000000000000000000000000001",
  name: "Support line",
  type: "EXTERNAL",
  endpoint: "voice.example.com:50061",
  textToSpeech: {
    productRef: "tts.elevenlabs",
    config: { voice: "rachel" },
    credentials: "encrypted-blob"
  },
  speechToText: {
    productRef: "stt.deepgram",
    config: { languageCode: "es-419", model: "nova-3" }
  }
};

const autopilot: LegacyApplication = {
  ref: "ap-1",
  accessKeyId: "WO00000000000000000000000000000002",
  name: "Receptionist",
  type: "AUTOPILOT",
  endpoint: "",
  textToSpeech: { productRef: "tts.deepgram", config: {} },
  speechToText: { productRef: "stt.google", config: {} },
  intelligence: {
    productRef: "llm.openai",
    config: { conversationSettings: {} }
  }
};

describe("@apiserver[applications/migration]", function () {
  it("maps an EXTERNAL app: ws URL from the gRPC endpoint, catalog voice, STT language", function () {
    const { app, notices } = convertLegacyApplication(external, OPTIONS);
    expect(app).to.deep.include({
      ref: "ext-1",
      workspaceRef: external.accessKeyId,
      url: "ws://voice.example.com:50061",
      flavor: "native",
      speech: { voice: "elevenlabs/rachel", language: "es-419" }
    });
    expect(app!.signingSecret).to.match(/^secret-/);
    const text = notices.map((n) => n.message).join("\n");
    expect(text).to.match(/session protocol/);
    expect(text).to.match(/workspace secret/);
    expect(text).to.match(/STT model nova-3/);
    expect(text).to.not.include("encrypted-blob");
  });

  it("maps an AUTOPILOT app to the hosted Autopilot with the native flavor", function () {
    const { app, notices } = convertLegacyApplication(autopilot, OPTIONS);
    expect(app!.url).to.equal("wss://autopilot.fonoster.com/session");
    expect(app!.flavor).to.equal("native");
    // No voice configured: the default; no language: the default.
    expect(app!.speech).to.deep.equal({
      voice: "deepgram/aura-2-thalia-en",
      language: "en-US"
    });
    expect(notices.some((n) => /hosted Autopilot/.test(n.message))).to.equal(
      true
    );
    expect(notices.some((n) => /STT vendor google/.test(n.message))).to.equal(
      true
    );
  });

  it("skips AUTOPILOT apps without an Autopilot URL and EXTERNAL apps without an endpoint", function () {
    expect(
      convertLegacyApplication(autopilot, {
        ...OPTIONS,
        autopilotUrl: undefined
      }).app
    ).to.equal(undefined);
    expect(
      convertLegacyApplication({ ...external, endpoint: "" }, OPTIONS).app
    ).to.equal(undefined);
  });

  it("uses URL overrides and passes ws(s) URLs through", function () {
    expect(
      convertLegacyApplication(external, {
        ...OPTIONS,
        urlOverrides: { "ext-1": "wss://bot.example.com/agent" }
      }).app!.url
    ).to.equal("wss://bot.example.com/agent");
    expect(
      convertLegacyApplication(
        { ...external, endpoint: "wss://already.example.com/s" },
        OPTIONS
      ).app!.url
    ).to.equal("wss://already.example.com/s");
  });

  it("migrates a store, is idempotent and never rotates secrets", async function () {
    const store = new InMemoryApplicationStore([external, autopilot]);
    const first = await migrateApplications(store, {
      ...OPTIONS,
      fallbackMessage: "We are having trouble, please call back."
    });
    expect(first.migrated.map((a) => a.ref)).to.deep.equal(["ext-1", "ap-1"]);
    const secret = store.migrated.get("ext-1")!.signingSecret;

    const second = await migrateApplications(store, OPTIONS);
    expect(store.migrated.get("ext-1")!.signingSecret).to.equal(secret);
    expect(store.migrated.get("ext-1")!.fallback).to.deep.equal({
      message: "We are having trouble, please call back."
    });
    expect(second.notices.some((n) => /new signing secret/.test(n.message))).to
      .be.false;
  });

  it("dry runs write nothing and can be limited to some apps", async function () {
    const store = new InMemoryApplicationStore([external, autopilot]);
    const report = await migrateApplications(store, {
      ...OPTIONS,
      dryRun: true,
      refs: ["ap-1"]
    });
    expect(report.migrated.map((a) => a.ref)).to.deep.equal(["ap-1"]);
    expect(store.migrated.size).to.equal(0);
  });

  it("emits the gateway's apps list", function () {
    const { app } = convertLegacyApplication(external, OPTIONS);
    const [g] = toGatewayApps([app!]);
    expect(g).to.deep.equal({
      ref: "ext-1",
      url: "ws://voice.example.com:50061",
      flavor: "native",
      signingSecret: app!.signingSecret,
      workspaceRef: external.accessKeyId,
      speech: { voice: "elevenlabs/rachel", language: "es-419" }
    });
  });

  it("AUTOPILOT apps share the hosted Autopilot's signing secret when given", function () {
    const options = { ...OPTIONS, autopilotSigningSecret: "hosted-secret" };
    const { app, notices } = convertLegacyApplication(autopilot, options);
    expect(app!.signingSecret).to.equal("hosted-secret");
    expect(notices.some((n) => /new signing secret/.test(n.message))).to.equal(
      false
    );
    const ext = convertLegacyApplication(external, options).app!;
    expect(ext.signingSecret).to.not.equal("hosted-secret");
  });

  it("the Prisma adapter writes the rebuild_persistence columns", async function () {
    const updates: { data: Record<string, unknown> }[] = [];
    const prisma = {
      application: {
        findMany: async () => [],
        findUnique: async () => ({
          ref: "ext-1",
          name: "Support line",
          accessKeyId: "WO1",
          url: "ws://x:1",
          flavor: "native",
          signingSecret: "s",
          speechVoice: "elevenlabs/rachel",
          speechLanguage: "es-419",
          fallbackMessage: "Sorry"
        }),
        update: async (args: { data: Record<string, unknown> }) => {
          updates.push(args);
          return {};
        }
      }
    };
    const store = new PrismaApplicationStore(prisma as never);
    const migrated = await store.getMigrated("ext-1");
    expect(migrated!.speech).to.deep.equal({
      voice: "elevenlabs/rachel",
      language: "es-419"
    });
    expect(migrated!.fallback).to.deep.equal({ message: "Sorry" });
    await store.saveMigrated(migrated!);
    expect(updates[0].data).to.deep.include({
      speechVoice: "elevenlabs/rachel",
      speechLanguage: "es-419",
      fallbackAppRef: null,
      fallbackMessage: "Sorry"
    });
    expect(updates[0].data).to.not.have.property("speech");
  });

  it("the Prisma adapter reads relations and explains missing columns", async function () {
    const updates: unknown[] = [];
    const prisma = {
      application: {
        findMany: async () => [{ ...external, createdAt: new Date() }],
        findUnique: async () => ({ ref: "ext-1", name: "Support line" }),
        update: async (args: unknown) => {
          updates.push(args);
          throw new Error("Unknown argument `url`. Available options are ...");
        }
      }
    };
    const store = new PrismaApplicationStore(prisma);
    const [legacy] = await store.listLegacy();
    expect(legacy.textToSpeech!.productRef).to.equal("tts.elevenlabs");
    expect(await store.getMigrated("ext-1")).to.equal(undefined);
    const { app } = convertLegacyApplication(legacy, OPTIONS);
    await store.saveMigrated(app!).then(
      () => expect.fail("should throw"),
      (e: Error) => expect(e.message).to.match(/no url, flavor/)
    );
    expect(updates).to.have.length(1);
  });
});
