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
import { z } from "zod";
import {
  agentSchema,
  type AgentValues,
  tabsWithErrors,
  toRequest,
  toUpdateRequest,
  toValues
} from "./agent-form";
import {
  billingAgent,
  cloudCatalog,
  fakeOnlyCatalog,
  sampleCatalog,
  vendorCatalog
} from "./fixtures";
import { templateValues } from "./templates";

describe("agent payload", () => {
  it("round-trips a saved agent into the session agent", () => {
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
      sttModel: "deepgram/nova-3",
      speed: 0
    });
    const config = request.intelligence!.config as Record<string, any>;
    const saved = billingAgent.intelligence!.config as any;
    // Only the session agent's keys (sessionAgentSchema is strict).
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
    expect(again.model.model).toBe("openai/gpt-4o-mini");
    expect(again.tts.voice).toBe("deepgram/aura-2-celeste-es");
    expect(again.stt.model).toBe("deepgram/nova-3");
  });

  it("keeps the call handling the agent page doesn't edit", () => {
    const saved = {
      ...billingAgent,
      url: "wss://autopilot.example.com",
      protocol: "fonoster",
      speech: {
        ...billingAgent.speech,
        ttsModel: "deepgram/aura-2",
        silenceTimeoutMs: 9000,
        patience: "high"
      },
      audio: { codec: "pcmu", rate: 8000 },
      fallbackAppRef: "app-fallback",
      fallbackMessage: "One moment",
      listeners: [{ url: "wss://listen.example.com", tracks: "inbound" }],
      recording: "on",
      amd: { enabled: true, windowMs: 3000 }
    } as unknown as typeof billingAgent;
    const values = { ...toValues(saved), name: "Renamed" };
    const request = toUpdateRequest(saved.ref, values, saved);
    expect(request).toMatchObject({
      ref: saved.ref,
      name: "Renamed",
      url: "wss://autopilot.example.com",
      protocol: "fonoster",
      audio: { codec: "pcmu", rate: 8000 },
      fallbackAppRef: "app-fallback",
      fallbackMessage: "One moment",
      listeners: [{ url: "wss://listen.example.com", tracks: "inbound" }],
      recording: "on",
      amd: { enabled: true, windowMs: 3000 },
      speech: {
        voice: "deepgram/aura-2-celeste-es",
        ttsModel: "deepgram/aura-2",
        silenceTimeoutMs: 9000,
        patience: "high"
      }
    });
  });

  it("maps an edited tool to the agent tool schema", () => {
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
    expect(tabsWithErrors(z.formatError(result.error!))).toContain("tools");
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
    const request = toRequest(
      templateValues("reminders", "Cobros", "es-419", vendorCatalog)
    );
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
      agentSchema.safeParse(
        templateValues("blank", "x", "en-US", sampleCatalog)
      ).success
    ).toBe(true);
  });

  it("prefers the keyless fakes over vendors for a new agent", () => {
    const request = toRequest(
      templateValues("blank", "Dev", "en-US", sampleCatalog)
    );
    expect(request.speech).toMatchObject({
      voice: "fake/default",
      sttModel: "fake/stt"
    });
    expect((request.intelligence!.config as any).languageModel.model).toBe(
      "fake/llm"
    );
  });

  it("creates an agent on the fakes when the workspace can use only them", () => {
    const request = toRequest(
      templateValues("blank", "Dev", "en-US", fakeOnlyCatalog)
    );
    expect(request.speech).toEqual({
      voice: "fake/default",
      ttsModel: "fake/tts",
      language: "en-US",
      sttModel: "fake/stt",
      speed: 0
    });
    expect((request.intelligence!.config as any).languageModel.model).toBe(
      "fake/llm"
    );
  });

  it("says Enter a number for a non-number", () => {
    const values = toValues(billingAgent) as any;
    values.model.maxTokens = "many";
    values.conversation.idleTimeoutSeconds = Number.NaN;
    const result = agentSchema.safeParse(values);
    const byPath = Object.fromEntries(
      result.error!.issues.map((i) => [i.path.join("."), i.message])
    );
    expect(byPath["model.maxTokens"]).toBe("Enter a number");
    expect(byPath["conversation.idleTimeoutSeconds"]).toBe("Enter a number");
  });

  it("starts a new agent in es-MX on Flux Fernanda (#1323)", () => {
    expect(
      toRequest(templateValues("blank", "Front desk", "es-MX", cloudCatalog))
        .speech
    ).toMatchObject({
      voice: "deepgram/flux-fernanda-es",
      ttsModel: "deepgram/flux",
      language: "es-MX"
    });
  });
});

describe("voice, model and speed (#1323)", () => {
  const onFlux = {
    ...billingAgent,
    speech: {
      voice: "deepgram/flux-fernanda-es",
      ttsModel: "deepgram/flux",
      language: "es-MX",
      sttModel: "deepgram/nova-3"
    }
  } as typeof billingAgent;

  it("saves a typed voice ID with its vendor and the model", () => {
    const values = toValues(onFlux, cloudCatalog);
    values.tts.voice = "";
    values.tts.voiceId = "flux-kit-en";
    expect(toRequest(values).speech).toMatchObject({
      voice: "deepgram/flux-kit-en",
      ttsModel: "deepgram/flux"
    });
  });

  it("saves the speed, and 1.0× as unset", () => {
    const values = toValues(onFlux, cloudCatalog);
    expect(values.tts.speed).toBe(1);
    expect(toRequest(values).speech).toMatchObject({ speed: 0 });
    values.tts.speed = 1.1;
    const request = toUpdateRequest(onFlux.ref, values, onFlux);
    expect(request.speech).toMatchObject({ speed: 1.1 });
    expect(
      toValues({ ...onFlux, speech: request.speech } as never, cloudCatalog).tts
        .speed
    ).toBe(1.1);
  });

  it("starts the model from the saved one, else the voice's first", () => {
    expect(toValues(onFlux, cloudCatalog).tts).toMatchObject({
      provider: "deepgram",
      model: "deepgram/flux",
      voice: "deepgram/flux-fernanda-es",
      voiceId: ""
    });
    const { ttsModel: _, ...noModel } = onFlux.speech!;
    expect(
      toValues({ ...onFlux, speech: noModel } as never, cloudCatalog).tts.model
    ).toBe("deepgram/flux");
  });

  it("opens a voice the catalog doesn't offer as a voice ID and saves it unchanged", () => {
    for (const speech of [
      { ...onFlux.speech, voice: "deepgram/my-private-voice" },
      // An unavailable voice saved without a model.
      billingAgent.speech
    ]) {
      const app = { ...onFlux, speech } as typeof billingAgent;
      const values = toValues(app, cloudCatalog);
      expect(values.tts.voice).toBe("");
      expect(values.tts.voiceId).toBe(speech!.voice!.split("/")[1]);
      expect(toUpdateRequest(app.ref, values, app).speech).toEqual({
        ...speech,
        speed: 0
      });
    }
  });

  it("asks for a voice when neither the list nor the ID has one, and bounds the speed", () => {
    const issues = (tts: Partial<AgentValues["tts"]>) => {
      const values = toValues(onFlux, cloudCatalog);
      Object.assign(values.tts, tts);
      return agentSchema
        .safeParse(values)
        .error?.issues.map((i) => [i.path.join("."), i.message]);
    };
    expect(issues({ voice: "", voiceId: " " })).toEqual([
      ["tts.voice", "Pick a voice"]
    ]);
    expect(issues({ speed: 1.3 })).toEqual([
      ["tts.speed", "Must be between 0.7 and 1.2"]
    ]);
    expect(issues({ speed: 0.7 })).toBeUndefined();
  });
});
