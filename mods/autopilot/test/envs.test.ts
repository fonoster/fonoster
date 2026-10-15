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
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { loadServiceConfig, strictDeep } from "@fonoster/common";
import { expect } from "chai";
import { autopilotConfigSchema, MOVED_KEYS } from "../src/envs";
import { ConversationProvider } from "../src/types";

const parse = (raw: unknown) => strictDeep(autopilotConfigSchema).parse(raw);

describe("@autopilot[envs/autopilotConfigSchema]", function () {
  it("fills sane defaults from an empty config", function () {
    const cfg = parse({});
    expect(cfg.server.bindAddr).to.equal("0.0.0.0:50061");
    expect(cfg.server.identityAddress).to.equal("api.fonoster.com");
    expect(cfg.apiserver.endpoint).to.equal("apiserver:50051");
    expect(cfg.conversation.provider).to.equal(ConversationProvider.FILE);
    // The /api/recordings bridge is gone: no default points at it.
    expect(cfg.recordings).to.equal(undefined);
    expect(cfg.dev.skipIdentity).to.equal(false);
    expect(cfg.knowledgeBase.enabled).to.equal(false);
    expect(cfg.logs.level).to.equal("info");
  });

  it("accepts a typical API-provider config", function () {
    const cfg = parse({
      apiserver: { endpoint: "apiserver:50051" },
      conversation: { provider: "api" },
      integrationsFile: "/opt/fonoster/integrations.yaml",
      recordings: { baseUrl: "http://apiserver:9876/api/recordings" }
    });
    expect(cfg.conversation.provider).to.equal(ConversationProvider.API);
    expect(cfg.integrationsFile).to.equal("/opt/fonoster/integrations.yaml");
  });

  it("rejects an unknown conversation provider", function () {
    expect(() => parse({ conversation: { provider: "magic" } })).to.throw();
  });

  it("requires storage, Unstructured and embeddings keys when knowledgeBase is enabled", function () {
    const result = strictDeep(autopilotConfigSchema).safeParse({
      knowledgeBase: { enabled: true }
    });
    expect(result.success).to.equal(false);
    const paths = result.success
      ? []
      : result.error.issues.map((issue) => issue.path.join("."));
    expect(paths).to.include.members([
      "knowledgeBase.s3.accessKeyId",
      "knowledgeBase.s3.secretAccessKey",
      "knowledgeBase.unstructured.apiKey",
      "knowledgeBase.embeddings.openaiApiKey"
    ]);
  });

  it("passes when knowledgeBase is enabled with its keys", function () {
    const cfg = parse({
      knowledgeBase: {
        enabled: true,
        s3: { accessKeyId: "a", secretAccessKey: "b" },
        unstructured: { apiKey: "c" },
        embeddings: { openaiApiKey: "sk-test" }
      }
    });
    expect(cfg.knowledgeBase.s3.region).to.equal("us-east-1");
  });

  it("rejects unknown keys", function () {
    expect(() => parse({ apiserver: { endpiont: "x" } })).to.throw();
  });

  it("points keys from the first draft to their new place", function () {
    const dir = mkdtempSync(join(tmpdir(), "fonoster-autopilot-"));
    const path = join(dir, "autopilot.yaml");
    writeFileSync(path, "apiserverEndpoint: apiserver:50051\n");
    try {
      expect(() =>
        loadServiceConfig({
          service: "autopilot",
          schema: autopilotConfigSchema,
          argv: ["node", "autopilot", "--config", path],
          env: {},
          movedKeys: MOVED_KEYS
        })
      ).to.throw(/"apiserverEndpoint" moved to "apiserver.endpoint"/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("@autopilot[envs/getConfig]", function () {
  it("doesn't read autopilot.yaml when the package is imported as a library", function () {
    const argv = process.argv;
    // The API server imports this package with its own --config flag.
    process.argv = [
      "node",
      "apiserver",
      "--config",
      "/nonexistent/fonoster.yaml"
    ];
    try {
      expect(() => require("../src")).not.to.throw();
    } finally {
      process.argv = argv;
    }
  });
});
