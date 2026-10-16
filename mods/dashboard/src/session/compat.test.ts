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
import {
  assistantRequirements,
  compatibleLlmModels,
  compatibleSttModels,
  compatibleVoices,
  fitsLanguage
} from "./compat";
import { catalog } from "./mock-api";

const ids = (e: { id: string }[]) => e.map((x) => x.id);

describe("picker compatibility", () => {
  it("matches languages by base language, multi and unstated", () => {
    const e = (languages?: string[]) => ({
      id: "x",
      label: "x",
      state: "active" as const,
      languages
    });
    expect(fitsLanguage(e(["en"]), "en-US")).toBe(true);
    expect(fitsLanguage(e(["es-CO"]), "es-419")).toBe(true);
    expect(fitsLanguage(e(["en"]), "es-419")).toBe(false);
    expect(fitsLanguage(e(["multi"]), "fr-FR")).toBe(true);
    expect(fitsLanguage(e(), "fr-FR")).toBe(true);
    expect(fitsLanguage(e(["en"]), "")).toBe(true);
  });

  it("offers voices that speak the language and exist on a catalog TTS model", () => {
    expect(ids(compatibleVoices(catalog, "es-419"))).toEqual([
      "elevenlabs/rachel",
      "elevenlabs/adam",
      "deepgram/aura-2-celeste-es"
    ]);
    const noModel = {
      ...catalog,
      ttsModels: catalog.ttsModels.filter((m) => m.id !== "deepgram/aura-2")
    };
    expect(ids(compatibleVoices(noModel, "es-419"))).not.toContain(
      "deepgram/aura-2-celeste-es"
    );
  });

  it("keeps a saved value that no longer fits, marked", () => {
    const voices = compatibleVoices(catalog, "es-419", "deepgram/aura-asteria");
    expect(voices.at(-1)).toMatchObject({
      id: "deepgram/aura-asteria",
      incompatible: true
    });
  });

  it("offers STT models that understand the language", () => {
    expect(ids(compatibleSttModels(catalog, "es-419"))).toEqual([
      "deepgram/nova-3"
    ]);
    expect(ids(compatibleSttModels(catalog, "en-US"))).toEqual([
      "deepgram/nova-3",
      "deepgram/nova-2-phonecall"
    ]);
  });

  it("offers language models with the features the assistant needs", () => {
    const withTools = { languageModel: { tools: [{ name: "lookup" }] } };
    expect(assistantRequirements(withTools)).toEqual([
      "streaming",
      "tool-calling"
    ]);
    expect(ids(compatibleLlmModels(catalog, withTools))).toEqual([
      "openai/gpt-4o-mini"
    ]);
    expect(ids(compatibleLlmModels(catalog, {}))).toEqual([
      "openai/gpt-4o-mini",
      "acme/no-tools"
    ]);
  });
});
