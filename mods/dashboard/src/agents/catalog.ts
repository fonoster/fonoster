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
 * What an agent can be built from: the provider catalog the workspace can use
 * (ListCatalog: language models, voices, transcriber models, by catalog id and
 * label) and the languages an agent speaks.
 */
import type { CatalogItem } from "@fonoster/types";
import type { SelectOption } from "~/components/ui/select";

/** A model or voice the workspace can pick. */
export type CatalogOption = {
  /** Catalog id, e.g. deepgram/aura-2-thalia-en. */
  id: string;
  label: string;
  provider: string;
  /** Languages served ("multi" = any); empty = not stated. */
  languages: string[];
};

export type AgentCatalog = {
  /** Provider labels by provider id. */
  providers: Record<string, string>;
  llm: CatalogOption[];
  voices: CatalogOption[];
  stt: CatalogOption[];
};

export const EMPTY_CATALOG: AgentCatalog = {
  providers: {},
  llm: [],
  voices: [],
  stt: []
};

/** The provider of a catalog id ("deepgram/nova-3" → "deepgram"). */
export function providerOf(id: string): string {
  const slash = id.indexOf("/");
  return slash > 0 ? id.slice(0, slash) : "";
}

export function toAgentCatalog(items: CatalogItem[]): AgentCatalog {
  const option = (i: CatalogItem): CatalogOption => ({
    id: i.id,
    label: i.label || i.id.slice(i.providerId.length + 1) || i.id,
    provider: i.providerId,
    languages: i.languages ?? []
  });
  const providers: Record<string, string> = {};
  for (const i of items)
    if (i.kind === "provider") providers[i.id] = i.label || i.id;
  return {
    providers,
    llm: items
      .filter((i) => i.kind === "model" && i.type === "llm")
      .map(option),
    voices: items.filter((i) => i.kind === "voice").map(option),
    stt: items.filter((i) => i.kind === "model" && i.type === "stt").map(option)
  };
}

/** Provider choices for a list of options, in catalog order. */
export function providerOptions(
  catalog: AgentCatalog,
  options: CatalogOption[]
): SelectOption[] {
  const ids = [...new Set(options.map((o) => o.provider))];
  return ids.map((id) => ({ value: id, label: catalog.providers[id] ?? id }));
}

/** An option's label; without one (not offered), its id after the provider. */
export function labelOf(options: CatalogOption[], id: string): string {
  return (
    options.find((o) => o.id === id)?.label ??
    (id.slice(providerOf(id).length + 1) || id)
  );
}

/** The provider's label, or its id. */
export function providerLabel(catalog: AgentCatalog, id: string): string {
  return catalog.providers[providerOf(id)] ?? providerOf(id);
}

/** Whether an option serves a language code (en-US matches en; "multi" matches any). */
export function speaks(option: CatalogOption, languageCode: string): boolean {
  if (!option.languages.length || option.languages.includes("multi"))
    return true;
  if (languageCode === "multi") return false;
  const base = (code: string) => code.split("-")[0].toLowerCase();
  return option.languages.some(
    (l) => l === languageCode || base(l) === base(languageCode)
  );
}

export type Language = SelectOption & {
  /** The voice picked for agents created in this language, when offered. */
  voice: string;
  /** Prompts for templates: Spanish for es-*, English otherwise. */
  locale: "en" | "es";
};

export const LANGUAGES: Language[] = [
  {
    value: "en-US",
    label: "English (US) · en-US",
    voice: "deepgram/aura-2-thalia-en",
    locale: "en"
  },
  {
    value: "en-GB",
    label: "English (UK) · en-GB",
    voice: "deepgram/aura-2-draco-en",
    locale: "en"
  },
  {
    value: "es-419",
    label: "Spanish (Latin America) · es-419",
    voice: "deepgram/aura-2-celeste-es",
    locale: "es"
  },
  {
    value: "es-MX",
    label: "Spanish (Mexico) · es-MX",
    voice: "deepgram/aura-2-estrella-es",
    locale: "es"
  },
  {
    value: "es-ES",
    label: "Spanish (Spain) · es-ES",
    voice: "deepgram/aura-2-nestor-es",
    locale: "es"
  },
  {
    value: "multi",
    label: "Multilingual (English + Spanish) · multi",
    voice: "deepgram/aura-2-celeste-es",
    locale: "es"
  }
];

export function languageOf(code: string): Language | undefined {
  return LANGUAGES.find((language) => language.value === code);
}

/** Picked for new agents when the workspace can use them. */
const PREFERRED = {
  stt: "deepgram/nova-3",
  llm: "openai/gpt-4o-mini"
};

/**
 * A new agent's voice, transcriber and language model: the preferred ones when offered, else the
 * first offered that serves the language, else the first offered ("" when none is).
 */
export function defaultsFor(
  catalog: AgentCatalog,
  languageCode: string
): { voice: string; stt: string; llm: string } {
  const pick = (options: CatalogOption[], preferred?: string) =>
    options.find((o) => o.id === preferred)?.id ??
    options.find((o) => speaks(o, languageCode))?.id ??
    options[0]?.id ??
    "";
  return {
    voice: pick(catalog.voices, languageOf(languageCode)?.voice),
    stt: pick(
      catalog.stt.filter((o) => speaks(o, languageCode)),
      PREFERRED.stt
    ),
    llm: pick(catalog.llm, PREFERRED.llm)
  };
}
