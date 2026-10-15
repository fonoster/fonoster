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
import { sessionAssistantSchema } from "@fonoster/common";
import { expect } from "chai";

// The rebuild stack's appsync (ops/rebuild/appsync.cjs): stored assistants become valid session
// assistants for the hosted Autopilot, and app speech defaults come from the legacy products.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appsync = require("../../../ops/rebuild/appsync.cjs");

describe("@autopilot[rebuild stack appsync]", function () {
  it("converts a stored assistant to the strict session assistant schema", function () {
    const legacy = {
      conversationSettings: {
        firstMessage: "Hello",
        systemPrompt: "Be brief.",
        goodbyeMessage: "Bye",
        systemErrorMessage: "Oops",
        maxSessionDuration: 600000,
        maxSpeechWaitTimeout: 500,
        transferOptions: {
          phoneNumber: "+1555",
          message: "Hold on",
          timeout: 30000
        },
        idleOptions: {
          message: "Still there?",
          timeout: 30000,
          maxTimeoutCount: 2
        },
        allowUserBargeIn: true,
        vad: {
          activationThreshold: 0.4,
          deactivationThreshold: 0.25,
          debounceFrames: 4
        }
      },
      languageModel: {
        provider: "openai",
        model: "gpt-4o-mini",
        temperature: 0.4,
        maxTokens: 250,
        knowledgeBase: [],
        tools: []
      },
      eventsHook: { url: "https://example.com", events: ["all"] }
    };
    const session = appsync.toSessionAssistant(legacy);
    const parsed = sessionAssistantSchema.parse(session);
    expect(parsed.languageModel.model).to.equal("openai/gpt-4o-mini");
    expect(parsed.conversationSettings.patience).to.equal("high");
    expect(parsed.conversationSettings.transferOptions).to.deep.equal({
      phoneNumber: "+1555",
      message: "Hold on"
    });
  });

  it("fills required settings when a stored assistant lacks them", function () {
    const parsed = sessionAssistantSchema.parse(appsync.toSessionAssistant({}));
    expect(parsed.languageModel.model).to.equal("openai/gpt-4o-mini");
    expect(parsed.conversationSettings.systemPrompt).to.be.a("string");
  });

  it("picks the app's voice: its own, its legacy voice when the gateway has the vendor, else the default", function () {
    expect(
      appsync.voiceFor({ speechVoice: "deepgram/aura-2-luna-en" })
    ).to.equal("deepgram/aura-2-luna-en");
    expect(
      appsync.voiceFor({
        textToSpeech: {
          productRef: "tts.deepgram",
          config: { voice: "aura-asteria-en" }
        }
      })
    ).to.equal("deepgram/aura-asteria-en");
    expect(
      appsync.voiceFor({
        textToSpeech: {
          productRef: "tts.google",
          config: { voice: "en-US-Neural2" }
        }
      })
    ).to.equal("deepgram/aura-2-thalia-en");
    expect(
      appsync.languageFor({
        speechToText: { config: { languageCode: "es-419" } }
      })
    ).to.equal("es-419");
  });
});
