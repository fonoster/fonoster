/*
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
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Registry as RegistryNs } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { expect } from "chai";
import { runWithDatabase } from "../../../common/src/registry/cli";
import {
  createTestDb,
  TestDb,
  testDatabaseUrl
} from "../../../common/test/persistence/testDb";
import {
  createProvidersHandlers,
  createRecordCatalogUse,
  listWarnings
} from "../../src/providers";
import { TEST_TOKEN } from "../utils";

// The provider registry's scenario suite (add-provider-registry task 1.1, build log LO-B13): every
// scenario in specs/provider-registry/spec.md, against a throwaway Postgres
// (PERSISTENCE_TEST_DATABASE_URL) with providers, models, voices and apps across two workspaces.
// Scenarios that run elsewhere (gateway conformance scenarios, Autopilot, dashboard) are listed
// in ELSEWHERE with the file that runs them; the last test checks that every spec scenario is
// covered here or there.

const SPEC = path.join(
  __dirname,
  "../../../../openspec/changes/add-provider-registry/specs/provider-registry/spec.md"
);
const ROOT = path.join(__dirname, "../../../..");

/** Spec scenarios run outside this suite, with the file that runs them. */
const ELSEWHERE: Record<string, string> = {
  "The utility's database role is limited":
    "mods/common/test/persistence/prisma.test.ts",
  "A workspace brings its own key": "mods/gateway/test/workspaceKeys.test.ts",
  "No workspace key falls back to the platform key":
    "mods/gateway/test/workspaceKeys.test.ts",
  "Autopilot resolves its LLM key":
    "mods/autopilot/test/session/hosted.test.ts",
  "A retired id sent at runtime resolves to its replacement":
    "mods/conformance/scenarios/voice-session/retired-voice-resolves.yaml",
  "TTS vendor outage mid-call":
    "mods/conformance/scenarios/voice-session/tts-outage-is-not-switched.yaml"
};

const W1 = "WSregistry1000000000000000000000000";
const W2 = "WSregistry2000000000000000000000000";

type Handler = (
  call: unknown,
  callback: (err: unknown, res?: unknown) => void
) => Promise<void> | void;

function invoke<T = Record<string, unknown>>(
  handler: Handler,
  request: unknown,
  accessKeyId = W1
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

/** Every "Requirement / Scenario" in the spec. */
function specScenarios(): string[] {
  const out: string[] = [];
  for (const line of fs.readFileSync(SPEC, "utf8").split("\n")) {
    const s = /^#### Scenario: (.+)$/.exec(line);
    if (s) out.push(s[1].trim());
  }
  return out;
}

describe("@registry scenario suite (spec.md, database)", function () {
  this.timeout(120_000);
  let db: TestDb;
  let tmp: string;
  const covered = new Set<string>();
  /** Registers a test as the runner of a spec scenario. */
  const scenario = (name: string, fn: () => Promise<void>) => {
    covered.add(name);
    it(name, fn);
  };

  const lines: string[] = [];
  const cli = async (...argv: string[]) => {
    lines.length = 0;
    return runWithDatabase(argv, (l) => lines.push(l), {
      prisma: db.prisma,
      actor: "ops@fonoster"
    });
  };
  const count = async () =>
    (await db.prisma.registryProvider.count()) +
    (await db.prisma.registryModel.count()) +
    (await db.prisma.registryVoice.count());

  before(async function () {
    if (!testDatabaseUrl()) return this.skip();
    db = (await createTestDb())!;
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "registry-spec-"));
    await db.prisma.product.create({
      data: { ref: "llm.openai", name: "OpenAI", vendor: "OPENAI", type: "LLM" }
    });
  });

  after(async function () {
    await db?.drop();
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  // ---- The catalog -------------------------------------------------------------------------

  scenario("Adding a provider with a known adapter", async function () {
    expect(
      await cli(
        "add-provider",
        "deepgram",
        "--adapter",
        "deepgram",
        "--capabilities",
        "stt,tts",
        "--credential-ref",
        "deepgram-default"
      )
    ).to.equal(0);
    expect(
      await db.prisma.registryProvider.findUnique({ where: { id: "deepgram" } })
    ).to.deep.include({
      state: "ACTIVE",
      credentialRef: "deepgram-default"
    });
  });

  scenario("Adding a provider with an unknown adapter", async function () {
    const before = await count();
    expect(
      await cli(
        "add-provider",
        "acme",
        "--adapter",
        "acme",
        "--capabilities",
        "tts",
        "--credential-ref",
        "acme-default"
      )
    ).to.equal(1);
    expect(lines).to.deep.equal(["error: unknown adapter: acme"]);
    expect(await count()).to.equal(before);
  });

  scenario("A model is registered", async function () {
    expect(
      await cli(
        "add-model",
        "deepgram/nova-3",
        "--type",
        "stt",
        "--features",
        "interim-results,word-timings",
        "--languages",
        "en,es,pt"
      )
    ).to.equal(0);
    await cli("show", "deepgram/nova-3");
    expect(JSON.parse(lines.join("\n"))).to.deep.include({
      type: "stt",
      state: "active",
      features: ["interim-results", "word-timings"],
      languages: ["en", "es", "pt"]
    });
    await cli("history", "deepgram/nova-3");
    expect(lines).to.have.length(1);
    expect(lines[0].split("\t").slice(1)).to.deep.equal([
      "ops@fonoster",
      "add-model",
      "deepgram/nova-3"
    ]);
  });

  scenario(
    "A voice is registered against the models it works with",
    async function () {
      await cli(
        "add-provider",
        "elevenlabs",
        "--adapter",
        "elevenlabs",
        "--capabilities",
        "tts",
        "--credential-ref",
        "elevenlabs-default"
      );
      for (const [id, settings] of [
        ["elevenlabs/flash-v2.5", "stability"],
        ["elevenlabs/multilingual-v2", "stability"],
        ["elevenlabs/turbo-v2", "stability,style"]
      ])
        expect(
          await cli(
            "add-model",
            id,
            "--type",
            "tts",
            "--features",
            "streaming",
            "--settings",
            settings
          )
        ).to.equal(0);
      expect(
        await cli(
          "add-voice",
          "elevenlabs/rachel",
          "--models",
          "elevenlabs/flash-v2.5,elevenlabs/multilingual-v2",
          "--language",
          "en",
          "--gender",
          "female"
        )
      ).to.equal(0);
      await cli("show", "elevenlabs/rachel");
      expect(JSON.parse(lines.join("\n")).models).to.deep.equal([
        "elevenlabs/flash-v2.5",
        "elevenlabs/multilingual-v2"
      ]);
      // The dashboard's voice picker filters by the voice's models (from ListCatalog).
      const { listCatalog } = createProvidersHandlers(db.prisma);
      const voices = await invoke<{ items: Record<string, unknown>[] }>(
        listCatalog,
        { kind: "voice" }
      );
      expect(
        voices.items.find((v) => v.id === "elevenlabs/rachel")
      ).to.deep.include({
        models: ["elevenlabs/flash-v2.5", "elevenlabs/multilingual-v2"]
      });
    }
  );

  scenario("A catalog id cannot be reused", async function () {
    await cli("add-model", "deepgram/nova-2", "--type", "stt");
    await cli("add-model", "deepgram/enhanced", "--type", "stt");
    await cli(
      "deprecate-model",
      "deepgram/enhanced",
      "--replacement",
      "deepgram/nova-3",
      "--retire-on",
      "2026-01-31"
    );
    await cli("retire-model", "deepgram/enhanced", "--yes");
    const before = await count();
    expect(
      await cli("add-model", "deepgram/enhanced", "--type", "stt")
    ).to.equal(1);
    expect(lines).to.deep.equal([
      "error: catalog id deepgram/enhanced already exists (state: retired)"
    ]);
    expect(await count()).to.equal(before);
  });

  // ---- Utility only, audited, no secrets ----------------------------------------------------

  scenario("The utility exposes the full command set", async function () {
    await cli("--help");
    const help = lines.join("\n");
    for (const c of [
      "add-provider",
      "add-model",
      "add-voice",
      "deprecate-provider",
      "deprecate-model",
      "deprecate-voice",
      "retire-provider",
      "retire-model",
      "retire-voice",
      "usage",
      "list",
      "show",
      "history",
      "export",
      "plan",
      "apply"
    ])
      expect(help).to.contain(c);
  });

  scenario("The public API cannot change the catalog", async function () {
    const handlers = createProvidersHandlers(db.prisma);
    // The API surface: reads, and the workspace's own keys (not catalog rows).
    expect(Object.keys(handlers).sort()).to.deep.equal([
      "deleteProviderKey",
      "listCatalog",
      "listProviderKeys",
      "listWarnings",
      "setProviderKey"
    ]);
    await cli("export");
    const before = lines.join("\n");
    const rows = await count();
    await invoke(handlers.setProviderKey, {
      providerId: "deepgram",
      key: "dg-test-key"
    });
    await invoke(handlers.listCatalog, {});
    await invoke(handlers.listWarnings, {});
    await invoke(handlers.deleteProviderKey, { providerId: "deepgram" });
    expect(await count()).to.equal(rows);
    await cli("export");
    expect(lines.join("\n")).to.equal(before);
  });

  scenario("Every write is audited", async function () {
    await cli("history", "deepgram/enhanced");
    expect(lines.map((l) => l.split("\t")[2])).to.deep.equal([
      "retire-model",
      "deprecate-model",
      "add-model"
    ]);
    const rows = await db.prisma.registryAudit.findMany({
      where: { target: "deepgram/enhanced" },
      orderBy: { seq: "asc" }
    });
    const deprecate = rows[1];
    expect(deprecate.actor).to.equal("ops@fonoster");
    expect(deprecate.at).to.be.instanceOf(Date);
    expect(deprecate.details).to.deep.include({
      command:
        "fonoster-registry deprecate-model deepgram/enhanced --replacement deepgram/nova-3 --retire-on 2026-01-31"
    });
    expect(deprecate.details.before).to.include({ state: "active" });
    expect(deprecate.details.after).to.include({
      state: "deprecated",
      replacement: "deepgram/nova-3"
    });
  });

  scenario("Export is safe to share", async function () {
    await cli("export");
    const yaml = lines.join("\n");
    expect(yaml).to.contain("deepgram/nova-3");
    expect(yaml).to.contain("credentialRef: deepgram-default");
    expect(yaml).to.not.match(/api[-_]?key|password|token|secret|sk-/i);
  });

  scenario("A key cannot be smuggled into the catalog", async function () {
    const before = await count();
    expect(
      await cli(
        "add-provider",
        "deepgram2",
        "--adapter",
        "deepgram",
        "--capabilities",
        "stt",
        "--api-key",
        "abc123"
      )
    ).to.equal(1);
    expect(lines).to.deep.equal(["error: unknown option: --api-key"]);
    expect(await count()).to.equal(before);
  });

  scenario("A workspace key is never returned", async function () {
    const handlers = createProvidersHandlers(db.prisma);
    const set = await invoke<Record<string, unknown>>(handlers.setProviderKey, {
      providerId: "elevenlabs",
      key: "el-secret-value"
    });
    const list = await invoke<{ items: Record<string, unknown>[] }>(
      handlers.listProviderKeys,
      {}
    );
    expect(JSON.stringify([set, list])).to.not.contain("el-secret-value");
    expect(list.items[0]).to.include({ providerId: "elevenlabs" });
  });

  // ---- Only usable providers ------------------------------------------------------------------

  scenario("A provider without a credential is hidden", async function () {
    // The platform has a Deepgram key but none for ElevenLabs.
    const { listCatalog } = createProvidersHandlers(db.prisma, {
      platformCredentials: ["deepgram-default"]
    });
    const ids = (
      await invoke<{ items: { id: string }[] }>(listCatalog, {}, W2)
    ).items.map((i) => i.id);
    expect(ids).to.include("deepgram/nova-3");
    expect(ids.filter((i) => i.startsWith("elevenlabs"))).to.deep.equal([]);
  });

  scenario("Bringing a key makes the provider appear", async function () {
    const handlers = createProvidersHandlers(db.prisma, {
      platformCredentials: ["deepgram-default"]
    });
    await invoke(
      handlers.setProviderKey,
      { providerId: "elevenlabs", key: "w2-el-key" },
      W2
    );
    const ids = (
      await invoke<{ items: { id: string }[] }>(handlers.listCatalog, {}, W2)
    ).items.map((i) => i.id);
    expect(ids).to.include.members(["elevenlabs", "elevenlabs/rachel"]);
  });

  // ---- Features ------------------------------------------------------------------------------

  scenario("Tools require tool calling", async function () {
    await cli(
      "add-provider",
      "openai",
      "--adapter",
      "openai",
      "--capabilities",
      "llm",
      "--credential-ref",
      "openai-default"
    );
    await cli(
      "add-model",
      "openai/gpt-4o",
      "--type",
      "llm",
      "--features",
      "streaming,tool-calling"
    );
    await cli(
      "add-model",
      "openai/small",
      "--type",
      "llm",
      "--features",
      "streaming"
    );
    await db.prisma.application.create({
      data: {
        ref: "bot-w2",
        accessKeyId: W2,
        name: "Billing bot",
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
    const store = await RegistryNs.PrismaRegistryStore.open(db.prisma);
    const usages = await RegistryNs.PrismaUsageSource.open(db.prisma);
    const r = new RegistryNs.Registry({ store, usages });
    const [use] = r.usage("openai/gpt-4o");
    expect(use.requires).to.include("tool-calling");
    // A model without tool-calling cannot take it.
    expect(r.impact("openai/gpt-4o", "openai/small").unmappable).to.have.length(
      1
    );
    // The dashboard greys out LLMs without the feature (it reads it from ListCatalog).
    const { listCatalog } = createProvidersHandlers(db.prisma);
    const llms = await invoke<{ items: Record<string, unknown>[] }>(
      listCatalog,
      { kind: "model", type: "llm" }
    );
    expect(
      llms.items.find((m) => m.id === "openai/small")!.features
    ).to.not.include("tool-calling");
  });

  scenario("Only voices valid for the model are offered", async function () {
    await cli(
      "add-model",
      "deepgram/aura-2",
      "--type",
      "tts",
      "--features",
      "streaming"
    );
    await cli("add-voice", "deepgram/thalia", "--models", "deepgram/aura-2");
    const store = await RegistryNs.PrismaRegistryStore.open(db.prisma);
    const r = new RegistryNs.Registry({ store });
    expect(r.voicesFor("deepgram/aura-2").map((v) => v.id)).to.deep.equal([
      "deepgram/thalia"
    ]);
  });

  // ---- Deprecation ---------------------------------------------------------------------------

  scenario("Deprecating a model prints the impact report", async function () {
    await cli(
      "add-voice",
      "elevenlabs/adam",
      "--models",
      "elevenlabs/turbo-v2,elevenlabs/flash-v2.5"
    );
    await cli(
      "add-voice",
      "elevenlabs/nova-legacy",
      "--models",
      "elevenlabs/turbo-v2"
    );
    await cli(
      "add-voice",
      "elevenlabs/bella",
      "--models",
      "elevenlabs/flash-v2.5"
    );
    // rachel works on turbo-v2 as well (re-adding is refused, so add the relation directly).
    await db.prisma.registryVoiceModel.create({
      data: {
        voiceId: "elevenlabs/rachel",
        modelId: "elevenlabs/turbo-v2",
        position: 2
      }
    });
    const app = (ref: string, ws: string, voice: string, style = false) =>
      db.prisma.application.create({
        data: {
          ref,
          accessKeyId: ws,
          name: ref,
          type: "EXTERNAL",
          endpoint: "",
          url: "wss://bot.example.com",
          flavor: "native",
          speechVoice: voice,
          speechTtsModel: "elevenlabs/turbo-v2",
          speechSettings: style
            ? { style: 0.4, stability: 1 }
            : { stability: 1 }
        }
      });
    // 41 / 9 / 3 apps in the spec; 4 / 2 / 1 here, two of them with `style`.
    for (let i = 0; i < 4; i++)
      await app(`rachel-${i}`, i < 2 ? W1 : W2, "elevenlabs/rachel", i < 2);
    for (let i = 0; i < 2; i++) await app(`adam-${i}`, W1, "elevenlabs/adam");
    await app("legacy-0", W2, "elevenlabs/nova-legacy");
    expect(
      await cli(
        "deprecate-model",
        "elevenlabs/turbo-v2",
        "--replacement",
        "elevenlabs/flash-v2.5",
        "--retire-on",
        "2027-01-31"
      )
    ).to.equal(0);
    expect(lines).to.include.members([
      "✓ voice rachel works on replacement (4 apps)",
      "✓ voice adam works on replacement (2 apps)",
      "✗ voice nova-legacy only exists on turbo-v2 (1 apps) → needs --voice-map nova-legacy=<voice>",
      '~ setting "style" not supported, will be dropped (soft) (2 apps)'
    ]);
    expect(
      await db.prisma.registryModel.findUnique({
        where: { id: "elevenlabs/turbo-v2" }
      })
    ).to.deep.include({
      state: "DEPRECATED",
      replacement: "elevenlabs/flash-v2.5",
      retireOn: "2027-01-31"
    });
  });

  scenario(
    "The replacement must be active and of the same kind",
    async function () {
      expect(
        await cli(
          "deprecate-model",
          "deepgram/nova-2",
          "--replacement",
          "elevenlabs/rachel",
          "--retire-on",
          "2027-01-31"
        )
      ).to.equal(1);
      expect(lines).to.deep.equal([
        "error: replacement must be an active model"
      ]);
    }
  );

  scenario("Warnings appear where the item is used", async function () {
    await db.prisma.application.create({
      data: {
        ref: "support-line",
        accessKeyId: W1,
        name: "Support line",
        type: "EXTERNAL",
        endpoint: "",
        speechSttModel: "deepgram/nova-2"
      }
    });
    expect(
      await cli(
        "deprecate-model",
        "deepgram/nova-2",
        "--replacement",
        "deepgram/nova-3",
        "--retire-on",
        "2027-01-31"
      )
    ).to.equal(0);
    const w = (await listWarnings(db.prisma, W1)).find(
      (x) => x.id === "deepgram/nova-2"
    )!;
    expect(w).to.deep.include({
      state: "deprecated",
      replacement: "deepgram/nova-3",
      retireOn: "2027-01-31"
    });
    expect(w.usedBy).to.deep.equal([
      {
        kind: "app",
        ref: "support-line",
        name: "Support line",
        field: "sttModel"
      }
    ]);
    // One provider.deprecated notice per workspace (the webhook; delivery is tested in
    // mods/common/test/persistence/prisma.test.ts).
    const notices = await db.prisma.registryNotice.findMany({
      where: { accessKeyId: W1, type: "provider.deprecated" }
    });
    expect(
      notices.filter(
        (n: { data: { id: string } }) => n.data.id === "deepgram/nova-2"
      )
    ).to.have.length(1);
  });

  scenario("Runtime use is caught", async function () {
    // W2 has no saved config naming nova-2; one of its sessions resolves it.
    expect(
      (await listWarnings(db.prisma, W2)).some(
        (w) => w.id === "deepgram/nova-2"
      )
    ).to.equal(false);
    const record = createRecordCatalogUse(db.prisma);
    await record({
      workspaceRef: W2,
      appRef: "app-runtime",
      sessionRef: "sess-1",
      id: "deepgram/nova-2",
      resolvedId: "deepgram/nova-2",
      event: "provider.deprecated_used",
      replacement: "deepgram/nova-3"
    });
    const w = (await listWarnings(db.prisma, W2)).find(
      (x) => x.id === "deepgram/nova-2"
    )!;
    expect(w).to.deep.include({
      replacement: "deepgram/nova-3",
      runtimeApps: ["app-runtime"],
      runtimeSessions: 1,
      usedBy: []
    });
  });

  scenario("Switching clears the warning", async function () {
    await db.prisma.application.update({
      where: { ref: "support-line" },
      data: { speechSttModel: "deepgram/nova-3" }
    });
    expect(
      (await listWarnings(db.prisma, W1)).some(
        (w) => w.id === "deepgram/nova-2"
      )
    ).to.equal(false);
    // Runtime warnings last 7 days after the last session that used the id.
    const later = new Date(Date.now() + 8 * 24 * 3600 * 1000);
    expect(
      (await listWarnings(db.prisma, W2, later)).some(
        (w) => w.id === "deepgram/nova-2"
      )
    ).to.equal(false);
  });

  scenario("The date passes without action", async function () {
    // deepgram/enhanced's retire date (2026-01-31) is past for nova-2's sibling; nova-2's own
    // date passing changes nothing either: no job looks at dates.
    const before = await db.prisma.registryModel.findUnique({
      where: { id: "deepgram/nova-2" }
    });
    await cli("list", "model");
    expect(lines).to.include("model\tdeepgram/nova-2\tdeprecated");
    expect(before.state).to.equal("DEPRECATED");
    const audit = await db.prisma.registryAudit.count({
      where: { target: "deepgram/nova-2", actor: { not: "ops@fonoster" } }
    });
    expect(audit).to.equal(0);
  });

  scenario("A workspace's cloned voice", async function () {
    await db.prisma.registryVoice.create({
      data: {
        id: "elevenlabs/w1-clone",
        providerId: "elevenlabs",
        ownerWorkspace: W1,
        models: { create: [{ modelId: "elevenlabs/turbo-v2" }] }
      }
    });
    await db.prisma.application.create({
      data: {
        ref: "clone-app",
        accessKeyId: W1,
        name: "Clone app",
        type: "EXTERNAL",
        endpoint: "",
        speechVoice: "elevenlabs/w1-clone",
        speechTtsModel: "elevenlabs/turbo-v2"
      }
    });
    const w = (await listWarnings(db.prisma, W1)).find(
      (x) => x.id === "elevenlabs/turbo-v2"
    )!;
    expect(w.usedBy).to.deep.include({
      kind: "app",
      ref: "clone-app",
      name: "Clone app",
      field: "ttsModel",
      voice: "elevenlabs/w1-clone"
    });
    // W2 never sees W1's cloned voice.
    const w2 = (await listWarnings(db.prisma, W2)).find(
      (x) => x.id === "elevenlabs/turbo-v2"
    )!;
    expect(JSON.stringify(w2)).to.not.contain("w1-clone");
  });

  // ---- Retirement ----------------------------------------------------------------------------

  scenario("Retiring without a voice map", async function () {
    // Snapshot of the configs before (the next scenario retires with a map in a copy).
    const store = await RegistryNs.PrismaRegistryStore.open(db.prisma);
    const usages = await RegistryNs.PrismaUsageSource.open(db.prisma);
    const report = new RegistryNs.Registry({ store, usages }).impact(
      "elevenlabs/turbo-v2",
      "elevenlabs/flash-v2.5"
    );
    expect(report.unmappable.map((u) => u.config.ref).sort()).to.deep.equal([
      "clone-app",
      "legacy-0"
    ]);
  });

  scenario("Compatible configs move to the replacement", async function () {
    expect(
      await cli(
        "retire-model",
        "elevenlabs/turbo-v2",
        "--voice-map",
        "nova-legacy=bella",
        "--yes"
      )
    ).to.equal(0);
    const app = (ref: string) =>
      db.prisma.application.findUnique({ where: { ref } });
    expect(await app("rachel-0")).to.deep.include({
      speechTtsModel: "elevenlabs/flash-v2.5",
      speechVoice: "elevenlabs/rachel",
      speechSettings: { stability: 1 }
    });
    expect(await app("legacy-0")).to.deep.include({
      speechTtsModel: "elevenlabs/flash-v2.5",
      speechVoice: "elevenlabs/bella"
    });
    // The cloned voice has no mapping: that app keeps the retired model and its warning.
    expect(await app("clone-app")).to.deep.include({
      speechTtsModel: "elevenlabs/turbo-v2"
    });
    const w = (await listWarnings(db.prisma, W1)).find(
      (x) => x.id === "elevenlabs/turbo-v2"
    )!;
    expect(w.state).to.equal("retired");
    expect(w.usedBy.map((u) => u.ref)).to.deep.equal(["clone-app"]);
    const rewrites = await db.prisma.registryAudit.count({
      where: { target: "elevenlabs/turbo-v2", action: "rewrite-config" }
    });
    expect(rewrites).to.equal(7);
    const notices = await db.prisma.registryNotice.findMany({
      where: { type: "provider.retired" }
    });
    expect(
      [
        ...new Set(notices.map((n: { accessKeyId: string }) => n.accessKeyId))
      ].sort()
    ).to.deep.equal([W1, W2].sort());
  });

  // ---- Usage, plan and apply -------------------------------------------------------------------

  scenario("Checking exposure before retiring", async function () {
    const record = createRecordCatalogUse(db.prisma);
    for (const s of ["a", "b", "c"])
      await record({
        workspaceRef: W1,
        appRef: "support-line",
        sessionRef: s,
        id: "deepgram/nova-3"
      });
    expect(await cli("usage", "deepgram/nova-3")).to.equal(0);
    expect(lines).to.deep.equal([
      `${W1}\tsessions (30 days)\t3`,
      `${W1}\tapp\tSupport line`
    ]);
  });

  scenario("Syncing a private cell", async function () {
    const cell = (await createTestDb())!;
    try {
      const file = path.join(tmp, "catalog.yaml");
      await cli("export");
      const exportA = lines.join("\n") + "\n";
      fs.writeFileSync(file, exportA);
      const onB = (...argv: string[]) => {
        lines.length = 0;
        return runWithDatabase(argv, (l) => lines.push(l), {
          prisma: cell.prisma,
          actor: "ops@cell-b"
        });
      };
      // Cell B: an older catalog, nova-2 still active and no nova-3.
      await onB(
        "add-provider",
        "deepgram",
        "--adapter",
        "deepgram",
        "--capabilities",
        "stt,tts",
        "--credential-ref",
        "deepgram-default"
      );
      await onB("add-model", "deepgram/nova-2", "--type", "stt");
      await onB("plan", "-f", file);
      expect(lines.join("\n")).to.contain("+ add model deepgram/nova-3");
      expect(lines.join("\n")).to.contain(
        "~ deprecate model deepgram/nova-2 → deepgram/nova-3"
      );
      expect(await onB("apply", "-f", file)).to.equal(0);
      await onB("export");
      expect(lines.join("\n") + "\n").to.equal(exportA);
    } finally {
      await cell.drop();
    }
  });

  scenario("Apply is idempotent", async function () {
    const file = path.join(tmp, "catalog.yaml");
    const audits = await db.prisma.registryAudit.count();
    expect(await cli("apply", "-f", file)).to.equal(0);
    expect(lines).to.deep.equal(["no changes"]);
    expect(await db.prisma.registryAudit.count()).to.equal(audits);
  });

  it("covers every scenario of the spec here or in a named suite", function () {
    const missing = specScenarios().filter(
      (s) => !covered.has(s) && !ELSEWHERE[s]
    );
    expect(missing, "spec scenarios without a test").to.deep.equal([]);
    for (const [s, file] of Object.entries(ELSEWHERE)) {
      expect(specScenarios(), `stale entry "${s}"`).to.include(s);
      expect(fs.existsSync(path.join(ROOT, file)), file).to.equal(true);
    }
  });
});
