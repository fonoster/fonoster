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
/** Sample agents, numbers and provider catalog for tests and stories. */
import type { Application, CatalogItem, INumber } from "@fonoster/types";
import { toAgentCatalog } from "./catalog";

const at = (iso: string) => new Date(iso);

export const billingAgent = {
  ref: "ap-7f3c91",
  name: "Billing reminders",
  type: "AUTOPILOT",
  endpoint: "",
  url: "wss://autopilot.fonoster.local/session",
  protocol: "fonoster",
  speech: {
    voice: "deepgram/aura-2-celeste-es",
    language: "es-419",
    sttModel: "deepgram/nova-3"
  },
  intelligence: {
    productRef: "llm.openai",
    config: {
      conversationSettings: {
        firstMessage:
          "Hola, le llamo de Acme sobre su factura pendiente. ¿Tiene un minuto?",
        systemPrompt:
          "# Role\nYou are Sofía, a friendly billing agent for Acme.\n\n# Goal\nRemind the customer about their open invoice and agree on a payment date.",
        goodbyeMessage: "Gracias por su tiempo. ¡Que tenga buen día!",
        systemErrorMessage: "Disculpe, hubo un error. Le llamamos luego.",
        maxSessionDuration: 1800000,
        allowUserBargeIn: true,
        idleOptions: {
          message: "¿Sigue ahí?",
          timeout: 10000,
          maxTimeoutCount: 3
        },
        transferOptions: {
          phoneNumber: "+18095550100",
          message: "Le transfiero con una persona."
        }
      },
      languageModel: {
        model: "openai/gpt-4o-mini",
        temperature: 0.4,
        maxTokens: 300,
        knowledgeBase: [],
        tools: [
          {
            name: "get_invoice",
            description: "Looks up the customer's open invoice.",
            parameters: {
              type: "object",
              properties: { invoiceId: { type: "string" } },
              required: ["invoiceId"]
            },
            operation: {
              method: "get",
              url: "https://api.acme.com/invoices",
              waitForResponse: true,
              headers: { "x-api-key": "secret" }
            }
          },
          {
            name: "schedule_payment",
            description:
              "Schedules a payment for an open invoice once the customer agrees on a date.",
            requestStartMessage: "Un momento, estoy registrando su pago…",
            parameters: {
              type: "object",
              properties: {
                invoiceId: { type: "string" },
                paymentDate: { type: "string", format: "date-time" },
                method: {
                  type: "string",
                  format: "enum",
                  enum: ["card", "transfer"]
                }
              },
              required: ["invoiceId", "paymentDate"]
            },
            operation: {
              method: "post",
              url: "https://api.acme.com/payments",
              waitForResponse: true
            }
          }
        ]
      },
      testCases: {
        evalsLanguageModel: { provider: "openai", model: "gpt-4o-mini" },
        scenarios: []
      }
    }
  },
  createdAt: at("2026-09-28"),
  updatedAt: at("2026-10-02")
} as unknown as Application;

const simple = (
  ref: string,
  name: string,
  provider: string,
  model: string,
  voice: string,
  languageCode: string,
  updated: string
) =>
  ({
    ...billingAgent,
    ref,
    name,
    speech: {
      voice: `deepgram/${voice}`,
      language: languageCode,
      sttModel: "deepgram/nova-3"
    },
    intelligence: {
      productRef: `llm.${provider}`,
      config: {
        ...billingAgent.intelligence!.config,
        languageModel: {
          model: `${provider}/${model}`,
          temperature: 0.4,
          maxTokens: 300,
          tools: []
        }
      }
    },
    createdAt: at(updated),
    updatedAt: at(updated)
  }) as unknown as Application;

export const sampleAgents: Application[] = [
  billingAgent,
  simple(
    "ap-2b8e04",
    "Front desk (ES)",
    "anthropic",
    "claude-haiku-4-5",
    "aura-2-diana-es",
    "es-ES",
    "2026-10-01"
  ),
  simple(
    "ap-91d0aa",
    "Order status",
    "groq",
    "llama-3.3-70b-versatile",
    "aura-2-thalia-en",
    "en-US",
    "2026-09-30"
  ),
  simple(
    "ap-c4410e",
    "Appointment booking",
    "openai",
    "gpt-4o",
    "aura-2-andromeda-en",
    "en-US",
    "2026-09-28"
  )
];

export const voiceApp = {
  ref: "ap-ext001",
  name: "IVR (external)",
  type: "STREAM",
  endpoint: "ivr.acme.com:50061",
  createdAt: at("2026-09-01"),
  updatedAt: at("2026-09-01")
} as unknown as Application;

const number = (
  ref: string,
  telUrl: string,
  appRef: string | undefined,
  trunk: string
) =>
  ({
    ref,
    name: trunk,
    telUrl,
    appRef,
    city: "Santo Domingo",
    country: "Dominican Republic",
    countryIsoCode: "DO",
    trunk: { ref: `tr-${trunk.toLowerCase()}`, name: trunk },
    createdAt: at("2026-09-01"),
    updatedAt: at("2026-09-01")
  }) as INumber;

export const sampleNumbers: INumber[] = [
  number("nm-1", "tel:+18295550199", "ap-7f3c91", "Claro"),
  number("nm-2", "tel:+18095550177", "ap-7f3c91", "Altice"),
  number("nm-3", "tel:+34910555210", "ap-2b8e04", "Telefonica"),
  number("nm-4", "tel:+14155550175", "ap-91d0aa", "Twilio")
];

const item = (
  id: string,
  kind: CatalogItem["kind"],
  label: string,
  extra: Partial<CatalogItem> = {}
): CatalogItem => ({
  id,
  kind,
  label,
  state: "active",
  providerId: id.split("/")[0],
  ...extra
});

/** The fake provider as ListCatalog returns it (mods/conformance/fakes.catalog.yaml). */
export const fakeCatalogItems: CatalogItem[] = [
  item("fake", "provider", "Fakes", {
    capabilities: ["stt", "tts", "llm"],
    keyless: true
  }),
  item("fake/llm", "model", "Fake LLM", { type: "llm" }),
  item("fake/stt", "model", "Fake transcriber", {
    type: "stt",
    languages: ["multi"]
  }),
  item("fake/tts", "model", "Fake voice", {
    type: "tts",
    languages: ["multi"]
  }),
  item("fake/default", "voice", "Fake voice", {
    type: "tts",
    languages: ["multi"],
    models: ["fake/tts"]
  })
];

/** A noise-cancelling provider, as ListCatalog returns it. */
export const noiseCancellingProvider: CatalogItem = item(
  "aicoustics",
  "provider",
  "ai-coustics",
  { capabilities: ["nc"] }
);

/** A workspace with Deepgram and OpenAI keys, and the fakes. */
export const sampleCatalogItems: CatalogItem[] = [
  item("deepgram", "provider", "Deepgram", { capabilities: ["stt", "tts"] }),
  item("openai", "provider", "OpenAI", { capabilities: ["llm"] }),
  item("deepgram/nova-2-phonecall", "model", "Nova 2 Phone Call", {
    type: "stt",
    languages: ["en"]
  }),
  item("deepgram/nova-3", "model", "Nova 3", {
    type: "stt",
    languages: ["en", "es", "multi"]
  }),
  item("deepgram/aura-2", "model", "Aura 2", {
    type: "tts",
    languages: ["en", "es"]
  }),
  item("openai/gpt-4o-mini", "model", "GPT-4o Mini", { type: "llm" }),
  item("openai/gpt-4.1-mini", "model", "GPT-4.1 Mini", { type: "llm" }),
  ...[
    ["aura-2-thalia-en", "Aura 2 Thalia", "en-US"],
    ["aura-2-andromeda-en", "Aura 2 Andromeda", "en-US"],
    ["aura-2-draco-en", "Aura 2 Draco", "en-GB"],
    ["aura-2-celeste-es", "Aura 2 Celeste", "es-CO"],
    ["aura-2-nestor-es", "Aura 2 Nestor", "es-ES"]
  ].map(([voice, label, language]) =>
    item(`deepgram/${voice}`, "voice", label, {
      type: "tts",
      languages: [language],
      models: ["deepgram/aura-2"]
    })
  ),
  ...fakeCatalogItems
];

export const sampleCatalog = toAgentCatalog(sampleCatalogItems);
/** The vendors without the fakes, as in an install whose catalog has no keyless provider. */
export const vendorCatalogItems = sampleCatalogItems.filter(
  (i) => i.providerId !== "fake"
);
export const vendorCatalog = toAgentCatalog(vendorCatalogItems);
export const fakeOnlyCatalog = toAgentCatalog(fakeCatalogItems);
