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
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { CellSecrets, Registry } from "@fonoster/common";
import {
  FakeGateway,
  FakesHarness,
  interpolate,
  loadScenarios,
  runScenario
} from "@fonoster/conformance";
import {
  CellSecretCredentials,
  ConfigCredentials,
  DatabaseWorkspaceSecrets,
  LayeredCredentials,
  PrismaAssistantSource,
  loadHostedConfig,
  RegistryLlmResolver,
  eagerKnowledge,
  s3Knowledge,
  sessionAssistantSchema,
  startHostedAutopilot
} from "../../src/session";

// The hosted Autopilot (task 4.3) runs the whole autopilot suite the way production does: the
// assistant comes from the app's record, the model from the provider registry, the key through a
// credential ref (task 3.1), never from the scenario or Autopilot's environment.
const SECRET = "hosted-autopilot";

function catalog(dir: string, options: { deprecate?: boolean } = {}) {
  const file = path.join(dir, "registry.json");
  const registry = new Registry.Registry({
    store: new Registry.FileRegistryStore(file),
    testMode: true,
    actor: "test"
  });
  registry.addProvider({
    id: "fake",
    adapter: "fake",
    capabilities: ["llm"],
    credentialRef: "fake-llm"
  });
  registry.addModel({
    id: "fake/llm",
    type: "llm",
    features: ["streaming", "tool-calling"]
  });
  registry.addProvider({
    id: "openai",
    adapter: "openai",
    capabilities: ["llm"],
    credentialRef: "openai-default"
  });
  registry.addModel({
    id: "openai/gpt-4o-mini",
    type: "llm",
    features: ["streaming", "tool-calling"]
  });
  if (options.deprecate) {
    registry.addModel({
      id: "fake/llm-2",
      type: "llm",
      features: ["streaming", "tool-calling"]
    });
    registry.deprecate("model", "fake/llm", "fake/llm-2", "2027-01-01");
  }
  return { file, registry };
}

function writeConfig(
  dir: string,
  llmUrl: string,
  assistant: unknown,
  extra: Record<string, unknown> = {}
) {
  catalog(dir);
  fs.writeFileSync(
    path.join(dir, "assistants.json"),
    JSON.stringify({ apps: { "app-1": { workspaceRef: "ws-1", assistant } } })
  );
  const file = path.join(dir, "autopilot.json");
  fs.writeFileSync(
    file,
    JSON.stringify({
      host: "127.0.0.1",
      port: 0,
      signingSecret: { value: SECRET },
      assistants: { file: "assistants.json" },
      registry: { file: "registry.json" },
      credentials: { "fake-llm": { value: "unused" } },
      endpoints: { fake: llmUrl },
      allowedDestinations: ["127.0.0.1"],
      testMode: true,
      ...extra
    })
  );
  return file;
}

describe("@autopilot/session hosted Autopilot", function () {
  this.timeout(15000);
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "autopilot-hosted-"));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  for (const scenario of loadScenarios("autopilot")) {
    it(`passes ${scenario.name} through the registry`, async function () {
      const harness = await new FakesHarness().start();
      const assistant = interpolate(scenario.setup!.assistant!, harness.vars());
      const server = await startHostedAutopilot(
        loadHostedConfig(writeConfig(dir, harness.llm.url, assistant))
      );
      try {
        const result = await runScenario(scenario, {
          harness,
          connect: () =>
            new FakeGateway({ signingSecret: SECRET }).dial(
              `ws://127.0.0.1:${server.port}/`
            )
        });
        expect(result.status, result.reason).to.equal("passed");
      } finally {
        await server.close();
        await harness.stop();
      }
    });
  }

  it("reads the example config", function () {
    const config = loadHostedConfig(
      path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "config",
        "autopilot-session.example.yaml"
      )
    );
    expect(config.port).to.equal(50061);
    expect(config.credentials["openai-default"]).to.deep.equal({
      env: "OPENAI_API_KEY"
    });
    expect(path.isAbsolute(config.registry.file)).to.equal(true);
  });

  it("rejects a connection with a bad signature before loading any assistant", async function () {
    const harness = await new FakesHarness().start();
    const server = await startHostedAutopilot(
      loadHostedConfig(
        writeConfig(dir, harness.llm.url, { not: "an assistant" })
      )
    );
    try {
      let failed = false;
      await new FakeGateway({ signingSecret: "wrong" })
        .dial(`ws://127.0.0.1:${server.port}/`)
        .catch(() => (failed = true));
      expect(failed).to.equal(true);
    } finally {
      await server.close();
      await harness.stop();
    }
  });
});

describe("@autopilot/session language models through the registry", function () {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "autopilot-llm-"));
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));
  const settings = { temperature: 0.4, maxTokens: 100 };

  it("resolves a catalog id to its provider, adapter endpoint and credential ref", async function () {
    const { registry } = catalog(dir);
    const asked: string[] = [];
    const resolver = new RegistryLlmResolver({
      registry,
      credentials: {
        get: (ref) => {
          asked.push(ref);
          return "k";
        }
      }
    });
    const r = await resolver.resolve("openai/gpt-4o-mini", settings, {});
    expect(r.id).to.equal("openai/gpt-4o-mini");
    expect(asked).to.deep.equal(["openai-default"]);
    expect(r.event).to.equal(undefined);
  });

  it("prefers the workspace's own key over the platform key", async function () {
    const credentials = new LayeredCredentials([
      {
        get: (ref, scope) =>
          scope.workspaceRef === "ws-1" && ref === "openai-default"
            ? "workspace-key"
            : undefined
      },
      new ConfigCredentials({ "openai-default": { value: "platform-key" } })
    ]);
    expect(
      await credentials.get("openai-default", { workspaceRef: "ws-1" })
    ).to.equal("workspace-key");
    expect(
      await credentials.get("openai-default", { workspaceRef: "ws-2" })
    ).to.equal("platform-key");
  });

  it("refuses a model without a credential and an id that is not a language model", async function () {
    const { registry } = catalog(dir);
    const resolver = new RegistryLlmResolver({
      registry,
      credentials: { get: () => undefined }
    });
    let error = "";
    await resolver
      .resolve("openai/gpt-4o-mini", settings, {})
      .catch((e: Error) => (error = e.message));
    expect(error).to.contain("no credential openai-default");
    await resolver
      .resolve("acme/brain", settings, {})
      .catch((e: Error) => (error = e.message));
    expect(error).to.contain("not a language model");
  });

  it("reports a deprecated model for the call record", async function () {
    const { registry } = catalog(dir, { deprecate: true });
    const resolver = new RegistryLlmResolver({
      registry,
      credentials: { get: () => "k" },
      endpoints: { fake: "http://127.0.0.1:1" }
    });
    const r = await resolver.resolve("fake/llm", settings, {});
    expect(r.event).to.deep.include({
      type: "provider.deprecated_used",
      id: "fake/llm",
      replacement: "fake/llm-2"
    });
  });

  it("apologises and hangs up when the model cannot be resolved", async function () {
    const harness = await new FakesHarness().start();
    const assistant = {
      conversationSettings: {
        firstMessage: "Hello",
        systemPrompt: "p",
        goodbyeMessage: "Bye",
        systemErrorMessage: "Sorry, something went wrong."
      },
      languageModel: { model: "openai/gpt-4o-mini" }
    };
    const server = await startHostedAutopilot(
      loadHostedConfig(writeConfig(dir, harness.llm.url, assistant))
    );
    try {
      const scenario = {
        ...loadScenarios("autopilot").find((s) => s.name === "normal-turn")!,
        steps: [
          loadScenarios("autopilot").find((s) => s.name === "normal-turn")!
            .steps[0],
          {
            expect: { type: "speak", text: "Sorry, something went wrong." },
            capture: { eid: "id" },
            within_ms: 2000
          },
          { send: { type: "output.done", id: "${eid}" } },
          { expect: { type: "hangup" }, within_ms: 2000 }
        ]
      };
      const result = await runScenario(scenario as never, {
        harness,
        connect: () =>
          new FakeGateway({ signingSecret: SECRET }).dial(
            `ws://127.0.0.1:${server.port}/`
          )
      });
      expect(result.status, result.reason).to.equal("passed");
    } finally {
      await server.close();
      await harness.stop();
    }
  });
});

describe("@autopilot/session knowledge port wiring", function () {
  it("logs a knowledge port that fails to build instead of an unhandled rejection (RV-B5)", async function () {
    const unhandled: unknown[] = [];
    const onUnhandled = (e: unknown) => unhandled.push(e);
    process.on("unhandledRejection", onUnhandled);
    try {
      const knowledgeFor = eagerKnowledge(async () => {
        throw new Error("no credentials");
      });
      const port = knowledgeFor({} as never, { workspaceRef: "WS-1" });
      await new Promise((r) => setTimeout(r, 20));
      expect(unhandled).to.deep.equal([]);
      expect(await port.find("hours", new AbortController().signal)).to.equal(
        ""
      );
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });

  it("builds the workspace's knowledge base with keys from credential refs", async function () {
    const made: Record<string, unknown>[] = [];
    const factory = s3Knowledge(
      {
        s3: {
          endpoint: "http://minio:9000",
          region: "us-east-1",
          accessKeyIdRef: "s3-id",
          secretAccessKeyRef: "s3-secret"
        },
        unstructured: { url: "http://unstructured", apiKeyRef: "unstructured" },
        embeddings: { apiKeyRef: "embeddings" }
      },
      new ConfigCredentials({
        "s3-id": { value: "AK" },
        "s3-secret": { value: "SK" },
        unstructured: { value: "UK" },
        embeddings: { value: "EK" }
      }),
      (params) => {
        made.push(params);
        return {
          load: async () => undefined,
          queryKnowledgeBase: async (q: string) => `about ${q}`
        };
      }
    );
    const assistant = sessionAssistantSchema.parse({
      conversationSettings: {
        systemPrompt: "p",
        goodbyeMessage: "b",
        systemErrorMessage: "e"
      },
      languageModel: {
        model: "fake/llm",
        knowledgeBase: [{ type: "s3", title: "Menu", document: "menu.pdf" }]
      }
    });
    const port = await factory(assistant, { workspaceRef: "WS-1" });
    expect(await port!.find("hours", new AbortController().signal)).to.equal(
      "about hours"
    );
    expect(made[0]).to.deep.include({
      bucket: "ws-1",
      documents: ["menu.pdf"],
      unstructuredAPIKey: "UK",
      embeddingsApiKey: "EK"
    });
    expect(
      (made[0].s3Config as { credentials: unknown }).credentials
    ).to.deep.equal({ accessKeyId: "AK", secretAccessKey: "SK" });
    // No documents, no port.
    const none = sessionAssistantSchema.parse({
      ...assistant,
      languageModel: { model: "fake/llm" }
    });
    expect(await factory(none, { workspaceRef: "ws-1" })).to.equal(undefined);
  });
});

describe("@autopilot/session assistants and keys from the database (CP-B11)", function () {
  const rows: Record<string, unknown> = {
    ap1: {
      ref: "ap1",
      accessKeyId: "WO1",
      type: "AUTOPILOT",
      intelligence: {
        config: { languageModel: { model: "openai/gpt-4o-mini" } }
      }
    },
    ext: {
      ref: "ext",
      accessKeyId: "WO1",
      type: "EXTERNAL",
      intelligence: null
    }
  };

  it("loads an Autopilot app's assistant and caches it", async function () {
    let calls = 0;
    let now = 0;
    const prisma = {
      application: {
        findUnique: async ({ where }: { where: { ref: string } }) => {
          calls++;
          return rows[where.ref] ?? null;
        }
      }
    };
    const source = new PrismaAssistantSource(prisma, {
      cacheMs: 5000,
      now: () => now
    });
    expect(await source.get("ap1")).to.deep.equal({
      assistant: { languageModel: { model: "openai/gpt-4o-mini" } },
      workspaceRef: "WO1"
    });
    expect(await source.get("ext")).to.equal(undefined);
    expect(await source.get("missing")).to.equal(undefined);
    await source.get("ap1");
    expect(calls).to.equal(3);
    now = 6000;
    await source.get("ap1");
    expect(calls).to.equal(4);
  });

  it("finds the workspace's vendor key through the credentialRef's provider", async function () {
    const prisma = {
      workspaceProviderKey: {
        findUnique: async ({
          where
        }: {
          where: Record<string, Record<string, string>>;
        }) =>
          where.accessKeyId_providerId.accessKeyId === "WO1" &&
          where.accessKeyId_providerId.providerId === "openai"
            ? { secretRef: "s1" }
            : null
      },
      secret: { findUnique: async () => ({ secret: "sk-workspace" }) }
    };
    const secrets = new DatabaseWorkspaceSecrets(
      new Registry.PrismaWorkspaceKeys(prisma),
      () => [{ id: "openai", credentialRef: "openai-default" }]
    );
    expect(
      await secrets.get("openai-default", { workspaceRef: "WO1" })
    ).to.equal("sk-workspace");
    expect(
      await secrets.get("openai-default", { workspaceRef: "WO2" })
    ).to.equal(undefined);
    expect(await secrets.get("other-ref", { workspaceRef: "WO1" })).to.equal(
      undefined
    );
  });

  it("needs a database section for database sources", function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ap-db-"));
    const file = path.join(dir, "autopilot.yaml");
    fs.writeFileSync(
      file,
      "signingSecret: { value: s }\nassistants: { source: database }\nregistry: { file: r.json }\n"
    );
    expect(() => loadHostedConfig(file)).to.throw(/database section/);
    fs.appendFileSync(file, "database: { url: postgres://x/y }\n");
    expect(loadHostedConfig(file).assistants).to.deep.equal({
      source: "database",
      cacheMs: 5000
    });
  });
});

describe("@autopilot/session cell secrets (add-private-regions PR-9)", function () {
  it("reads LLM keys from the cell's secret store by credentialRef or provider", async function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ap-cell-"));
    const file = path.join(dir, "secrets.enc");
    new CellSecrets.EncryptedFileSecretStore(file, "pass").set("groq", "gq");
    const yaml = path.join(dir, "autopilot.yaml");
    fs.writeFileSync(
      yaml,
      `signingSecret: { value: s }\nassistants: { file: a.json }\nregistry: { file: r.json }\nworkspaceSecrets: { cellSecrets: { file: ${file}, keyEnv: AP_CELL_KEY } }\n`
    );
    expect(loadHostedConfig(yaml).workspaceSecrets).to.deep.equal({
      cellSecrets: { file, keyEnv: "AP_CELL_KEY" }
    });
    const credentials = new CellSecretCredentials(
      new CellSecrets.CellSecretKeys(
        CellSecrets.openCellSecrets({ file, key: "pass" })
      ),
      () => [{ id: "groq", credentialRef: "groq-default" }]
    );
    expect(await credentials.get("groq-default")).to.equal("gq");
    expect(await credentials.get("openai-default")).to.equal(undefined);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
