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
/**
 * Picker filtering by catalog compatibility (add-provider-registry 4.2): what fits the app's
 * language, which voices have a TTS model in the catalog, and which language models have the
 * features an agent needs. Mirrors the registry's checker (mods/common registry/features.ts).
 */
import type { Catalog, CatalogEntry } from "./types";

const base = (lang: string) => lang.toLowerCase().split("-")[0];

/** An entry fits a language when it states none, serves "multi", or shares the base language. */
export function fitsLanguage(entry: CatalogEntry, language?: string): boolean {
  if (!language || language === "multi") return true;
  const langs = entry.languages ?? [];
  if (!langs.length || langs.includes("multi")) return true;
  return langs.some((l) => base(l) === base(language));
}

/** Hard requirements of an agent: replies stream; tools need tool calling. */
export function agentRequirements(agent: unknown): string[] {
  const tools = (agent as { languageModel?: { tools?: unknown[] } } | null)
    ?.languageModel?.tools;
  return Array.isArray(tools) && tools.length
    ? ["streaming", "tool-calling"]
    : ["streaming"];
}

/** Keeps the saved value selectable even when it no longer fits. */
function keep(all: CatalogEntry[], fit: CatalogEntry[], value?: string) {
  if (!value || fit.some((e) => e.id === value)) return fit;
  const saved = all.find((e) => e.id === value);
  return saved ? [...fit, { ...saved, incompatible: true }] : fit;
}

export function compatibleVoices(
  catalog: Catalog,
  language?: string,
  value?: string
): CatalogEntry[] {
  const tts = new Set(catalog.ttsModels.map((m) => m.id));
  const fit = catalog.voices.filter(
    (v) =>
      (!v.models?.length || !tts.size || v.models.some((m) => tts.has(m))) &&
      fitsLanguage(v, language)
  );
  return keep(catalog.voices, fit, value);
}

export function compatibleSttModels(
  catalog: Catalog,
  language?: string,
  value?: string
): CatalogEntry[] {
  return keep(
    catalog.sttModels,
    catalog.sttModels.filter((m) => fitsLanguage(m, language)),
    value
  );
}

export function compatibleLlmModels(
  catalog: Catalog,
  agent: unknown,
  value?: string
): CatalogEntry[] {
  const need = agentRequirements(agent);
  const fit = catalog.llmModels.filter(
    (m) => !m.features || need.every((f) => m.features!.includes(f))
  );
  return keep(catalog.llmModels, fit, value);
}
