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
import { expect } from "chai";
import { autopilotConfigSchema } from "../src/envs";
import { ConversationProvider } from "../src/types";

describe("@autopilot[envs/autopilotConfigSchema]", function () {
  it("fills sane defaults from an empty config", function () {
    const cfg = autopilotConfigSchema.parse({});
    expect(cfg.conversation.provider).to.equal(ConversationProvider.FILE);
    expect(cfg.apiserverEndpoint).to.equal("apiserver:50051");
    expect(cfg.recording.baseUrl).to.equal(
      "http://localhost:9876/api/recordings"
    );
    expect(cfg.skipIdentity).to.equal(false);
    expect(cfg.knowledgeBase.enabled).to.equal(false);
  });

  it("accepts a typical file-provider config", function () {
    const cfg = autopilotConfigSchema.parse({
      conversation: { provider: "file", file: "./config/assistant.json" },
      apiserverEndpoint: "apiserver:50051",
      recording: { baseUrl: "http://apiserver:9876/api/recordings" },
      openaiApiKey: "sk-test"
    });
    expect(cfg.openaiApiKey).to.equal("sk-test");
    expect(cfg.conversation.file).to.equal("./config/assistant.json");
  });

  it("rejects an unknown conversation provider", function () {
    expect(() =>
      autopilotConfigSchema.parse({
        conversation: { provider: "carrier-pigeon" }
      })
    ).to.throw();
  });

  it("requires S3 and Unstructured credentials when knowledgeBase is enabled", function () {
    expect(() =>
      autopilotConfigSchema.parse({ knowledgeBase: { enabled: true } })
    ).to.throw(/required when knowledgeBase\.enabled is true/);
  });

  it("passes when knowledgeBase is enabled with credentials", function () {
    const cfg = autopilotConfigSchema.parse({
      knowledgeBase: {
        enabled: true,
        s3: { accessKeyId: "AKIA", secretAccessKey: "shhh" },
        unstructured: { apiKey: "u-key" }
      }
    });
    expect(cfg.knowledgeBase.enabled).to.equal(true);
    expect(cfg.knowledgeBase.s3.region).to.equal("us-east-1");
  });
});
