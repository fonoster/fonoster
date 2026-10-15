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
import {
  agentSchema,
  tabsWithErrors,
  toRequest,
  toUpdateRequest,
  toValues
} from "./agent-form";
import { billingAgent } from "./fixtures";
import { templateValues } from "./templates";

describe("agent payload", () => {
  it("round-trips a saved agent into the session assistant", () => {
    const request = toUpdateRequest(
      billingAgent.ref,
      toValues(billingAgent),
      billingAgent
    );
    expect(request.ref).toBe("ap-7f3c91");
    expect(request.type).toBe("AUTOPILOT");
    expect(request.speech).toEqual({
      voice: "deepgram/aura-2-celeste-es",
      language: "es-419",
      sttModel: "deepgram/nova-3"
    });
    const config = request.intelligence!.config as Record<string, any>;
    const saved = billingAgent.intelligence!.config as any;
    // Only the session assistant's keys (sessionAssistantSchema is strict).
    expect(Object.keys(config).sort()).toEqual([
      "conversationSettings",
      "languageModel",
      "testCases"
    ]);
    expect(config.conversationSettings).not.toHaveProperty("vad");
    expect(config.conversationSettings).not.toHaveProperty(
      "maxSpeechWaitTimeout"
    );
    expect(config.conversationSettings.systemPrompt).toBe(
      saved.conversationSettings.systemPrompt
    );
    expect(config.languageModel).toMatchObject({
      model: saved.languageModel.model
    });
    expect(config.languageModel).not.toHaveProperty("provider");
    expect(config.languageModel.tools).toEqual(saved.languageModel.tools);
    expect(config.testCases).toEqual(saved.testCases);
    // Reading the request back gives the same editor values.
    const again = toValues({
      ...billingAgent,
      speech: request.speech,
      intelligence: { productRef: "llm.openai", config }
    } as never);
    expect(again.model.provider).toBe("openai");
    expect(again.model.model).toBe("gpt-4o-mini");
    expect(again.tts.voice).toBe("aura-2-celeste-es");
  });

  it("maps an edited tool to the assistant tool schema", () => {
    const values = toValues(billingAgent);
    values.tools = [
      {
        name: "book_slot",
        description: "Books an appointment slot.",
        method: "post",
        url: "https://api.acme.com/slots",
        parametersType: "object",
        parameters: [
          {
            name: "date",
            type: "string",
            format: "date-time",
            required: true,
            extra: {}
          },
          {
            name: "notes",
            type: "string",
            format: "",
            required: false,
            extra: {}
          }
        ],
        headers: [
          { key: "x-api-key", value: "k" },
          { key: "", value: "" }
        ],
        requestStartMessage: "",
        waitForResponse: false
      }
    ];
    const tools = (toRequest(values).intelligence!.config as any).languageModel
      .tools;
    expect(tools).toEqual([
      {
        name: "book_slot",
        description: "Books an appointment slot.",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", format: "date-time" },
            notes: { type: "string" }
          },
          required: ["date"]
        },
        operation: {
          method: "post",
          url: "https://api.acme.com/slots",
          waitForResponse: false,
          headers: { "x-api-key": "k" }
        }
      }
    ]);
  });

  it("rejects reserved headers, built-in names and duplicate tools", () => {
    const values = toValues(billingAgent);
    values.tools[0].headers = [{ key: "Content-Type", value: "x" }];
    values.tools[1].name = "hangup";
    const result = agentSchema.safeParse(values);
    const messages = result.error!.issues.map((i) => i.message);
    expect(messages).toContain("Accept and Content-Type are set for you");
    expect(messages).toContain("That name is taken by a built-in tool");
    expect(tabsWithErrors(result.error!.format())).toContain("tools");
  });

  it("drops transfer options when the transfer number is cleared", () => {
    const values = toValues(billingAgent);
    values.conversation.transferPhoneNumber = "";
    const settings = (
      toRequest(values, billingAgent).intelligence!.config as any
    ).conversationSettings;
    expect(settings).not.toHaveProperty("transferOptions");
  });

  it("builds a create payload from a template", () => {
    const request = toRequest(templateValues("reminders", "Cobros", "es-419"));
    expect(request).toMatchObject({
      name: "Cobros",
      type: "AUTOPILOT",
      speech: {
        voice: "deepgram/aura-2-celeste-es",
        language: "es-419",
        sttModel: "deepgram/nova-3"
      },
      intelligence: {
        config: {
          languageModel: {
            model: "openai/gpt-4o-mini",
            tools: [],
            knowledgeBase: []
          }
        }
      }
    });
    const config = request.intelligence!.config as any;
    expect(config.conversationSettings.firstMessage).toMatch(/^Hola/);
    expect(config).not.toHaveProperty("eventsHook");
    expect(
      agentSchema.safeParse(templateValues("blank", "x", "en-US")).success
    ).toBe(true);
  });
});
