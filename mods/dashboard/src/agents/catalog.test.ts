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
import { describe, expect, it } from "vitest";
import { defaultsFor, type AgentCatalog } from "./catalog";

// The shipped base catalog (ops/bundle/config/catalog.yaml, #1240) as ListCatalog offers it, plus
// an operator-added model listed first, so the preferred one has to win.
const BASE: AgentCatalog = {
  providers: { deepgram: "Deepgram", openai: "OpenAI" },
  llm: [
    {
      id: "openai/operator-added",
      label: "Operator Added",
      provider: "openai",
      languages: []
    },
    {
      id: "openai/gpt-5.4-mini",
      label: "GPT-5.4 Mini",
      provider: "openai",
      languages: []
    }
  ],
  voices: [
    {
      id: "deepgram/aura-2-thalia-en",
      label: "Aura 2 Thalia",
      provider: "deepgram",
      languages: ["en-US"]
    },
    {
      id: "deepgram/aura-2-selena-es",
      label: "Aura 2 Selena",
      provider: "deepgram",
      languages: ["es-419"]
    }
  ],
  stt: [
    {
      id: "deepgram/nova-3",
      label: "Nova 3",
      provider: "deepgram",
      languages: ["en", "es", "multi"]
    }
  ],
  ncProviders: []
};

describe("defaultsFor", () => {
  it("picks openai/gpt-5.4-mini and deepgram/nova-3 for a new agent on the base catalog", () => {
    expect(defaultsFor(BASE, "en-US")).toEqual({
      voice: "deepgram/aura-2-thalia-en",
      stt: "deepgram/nova-3",
      llm: "openai/gpt-5.4-mini"
    });
  });
});
