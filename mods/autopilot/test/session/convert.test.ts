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
import * as path from "path";
import { expect } from "chai";
import { convertLegacyAssistant, patienceFor } from "../../src/session";

// config/assistant.example.json uses tool formats "date" and "time", which today's tool schema
// already rejects (only "enum" and "date-time"); real stored assistants cannot contain them.
const example = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "config",
      "assistant.example.json"
    ),
    "utf8"
  ),
  (key, value) =>
    key === "format" && (value === "date" || value === "time")
      ? undefined
      : value
);

const minimal = (
  extra: Record<string, unknown> = {},
  lm: Record<string, unknown> = {}
) => ({
  conversationSettings: {
    systemPrompt: "p",
    goodbyeMessage: "bye",
    systemErrorMessage: "err",
    ...extra
  },
  languageModel: {
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.5,
    maxTokens: 200,
    ...lm
  }
});

describe("@autopilot/session convertLegacyAssistant", function () {
  it("converts the repository's example assistant", function () {
    const c = convertLegacyAssistant(example, { assistantRef: "a1" });
    expect(c.assistant.languageModel.model).to.equal("openai/gpt-4o");
    expect(c.assistant.languageModel.tools.map((t) => t.name)).to.deep.equal([
      "getAvailableTimes",
      "bookReservation"
    ]);
    expect(c.assistant.conversationSettings).to.deep.include({
      initialDtmf: "1",
      allowUserBargeIn: true
    });
    expect(c.assistant.conversationSettings.transferOptions).to.deep.equal({
      phoneNumber: "+17853178070",
      message: "Please hold while I transfer you to an operator."
    });
    // "your-api-key" is a placeholder: nothing to move.
    expect(c.secret).to.equal(undefined);
    expect(c.webhook).to.deep.equal({ url: "https://api.example.com/events" });
    expect(c.notices.join(" ")).to.contain("workspace webhook");
    expect(JSON.stringify(c.assistant))
      .to.not.contain("eventsHook")
      .and.not.contain('"apiKey"');
  });

  it("moves a real inline key out as the workspace's vendor key", function () {
    const c = convertLegacyAssistant(minimal({}, { apiKey: "sk-live-123" }), {
      assistantRef: "billing"
    });
    expect(c.secret).to.deep.equal({
      providerId: "openai",
      name: "provider-key/openai",
      value: "sk-live-123"
    });
    expect(JSON.stringify(c.assistant)).to.not.contain("sk-live-123");
  });

  it("maps VAD-era settings to the new model and reports what changed", function () {
    const c = convertLegacyAssistant(
      {
        ...minimal(
          {
            maxSpeechWaitTimeout: 800,
            vad: { activationThreshold: 0.6 },
            transferOptions: { phoneNumber: "+1", message: "m", timeout: 10000 }
          },
          { baseUrl: "http://ollama:11434" }
        ),
        audioFilters: [{ name: "aiCoustics" }]
      },
      { assistantRef: "a2" }
    );
    expect(c.assistant.conversationSettings.patience).to.equal("high");
    expect(c.appFilters).to.deep.equal([{ name: "aiCoustics" }]);
    expect(c.notices).to.have.length(5);
    expect(c.notices.join(" ")).to.contain("http://ollama:11434");
  });

  it("maps maxSpeechWaitTimeout to the patience knob and ignores default VAD", function () {
    expect(patienceFor(undefined)).to.equal("normal");
    expect(patienceFor(0)).to.equal("normal");
    expect(patienceFor(300)).to.equal("high");
    const c = convertLegacyAssistant(
      minimal({
        vad: {
          activationThreshold: 0.4,
          deactivationThreshold: 0.25,
          debounceFrames: 4
        }
      }),
      { assistantRef: "a3" }
    );
    expect(c.assistant.conversationSettings.patience).to.equal("normal");
    expect(c.notices.join(" ")).not.to.contain("VAD");
  });

  it("refuses unknown providers", function () {
    expect(() =>
      convertLegacyAssistant(minimal({}, { provider: "acme" }), {
        assistantRef: "x"
      })
    ).to.throw('unknown language model provider "acme"');
  });
});
