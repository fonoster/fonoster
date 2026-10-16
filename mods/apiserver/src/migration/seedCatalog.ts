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
import { Registry } from "@fonoster/common";
import {
  catalogId,
  credentialRefFor,
  PRODUCT_TYPES,
  providerOfProductRef,
  ttsModelFor,
  VENDOR_PROVIDERS
} from "./catalogMapping";
import { MigrationDb, newStepReport, StepOptions, StepReport } from "./types";

// add-provider-registry 5.1: the catalog is seeded from what the legacy rows use. Products become
// providers (credentialRef `<provider>-default`); the raw model and voice names on TTS, STT and
// assistant rows become catalog models and voices. Entries already in the catalog are never
// changed, so an operator's own catalog (catalog-seed.yaml) wins and re-runs add nothing.

type Row = { productRef: string; config: Record<string, unknown> | null };

const str = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim() : undefined;

const LLM_FEATURES = ["streaming", "tool-calling"];
const STREAMING = ["streaming"];

export async function seedCatalog(
  db: MigrationDb,
  options: StepOptions = {}
): Promise<StepReport> {
  const report = newStepReport("catalog");
  const persistent = await Registry.PrismaRegistryStore.open(db);
  let store: Registry.RegistryStore = persistent;
  if (options.dryRun) {
    store = new Registry.MemoryRegistryStore();
    persistent.all().forEach((e) => store.put(e));
  }
  const registry = new Registry.Registry({
    store,
    actor: "fonoster-migrate-legacy",
    commandLine: "fonoster-migrate-legacy"
  });
  const note = (ref: string, level: "info" | "action", message: string) =>
    report.notices.push({ ref, level, message });

  // Providers from products.
  const capabilities = new Map<string, Set<Registry.Capability>>();
  const products: { ref: string; vendor: string; type: string }[] =
    await db.product.findMany({ orderBy: { ref: "asc" } });
  for (const p of products) {
    const id = VENDOR_PROVIDERS[p.vendor];
    if (!id) {
      note(
        p.ref,
        "info",
        `product ${p.ref} (${p.vendor}) has no adapter in this release; not added to the catalog`
      );
      continue;
    }
    const set = capabilities.get(id) ?? new Set();
    set.add(PRODUCT_TYPES[p.type]);
    capabilities.set(id, set);
  }

  // Models and voices the rows use.
  const models = new Map<
    string,
    { type: Registry.Capability; languages: Set<string> }
  >();
  const voices = new Map<string, { model: string; language?: string }>();
  const model = (id: string, type: Registry.Capability, language?: string) => {
    const m = models.get(id) ?? { type, languages: new Set<string>() };
    if (language) m.languages.add(language.split("-")[0]);
    models.set(id, m);
    const provider = id.split("/")[0];
    const set = capabilities.get(provider) ?? new Set();
    set.add(type);
    capabilities.set(provider, set);
  };

  const tts: Row[] = await db.textToSpeech.findMany({
    select: { productRef: true, config: true }
  });
  for (const r of tts) {
    const provider = providerOfProductRef(r.productRef);
    const voice = str(r.config?.voice);
    if (!provider || !voice) continue;
    const ttsModel = ttsModelFor(provider, voice, r.config ?? {});
    model(ttsModel, "tts");
    voices.set(catalogId(provider, voice), {
      model: ttsModel,
      language: str(r.config?.languageCode)
    });
  }
  const stt: Row[] = await db.speechToText.findMany({
    select: { productRef: true, config: true }
  });
  for (const r of stt) {
    const provider = providerOfProductRef(r.productRef);
    const name = str(r.config?.model);
    if (provider && name)
      model(catalogId(provider, name), "stt", str(r.config?.languageCode));
  }
  const assistants: Row[] = await db.intelligence.findMany({
    select: { productRef: true, config: true }
  });
  for (const r of assistants) {
    const lm = (r.config?.languageModel ?? {}) as Record<string, unknown>;
    const name = str(lm.model);
    if (!name) continue;
    // A session assistant names a catalog id; a legacy one a provider and a raw model name.
    const provider =
      str(lm.provider) ?? (name.includes("/") ? name.split("/")[0] : undefined);
    if (provider && Object.values(VENDOR_PROVIDERS).includes(provider))
      model(catalogId(provider, name), "llm");
  }

  const add = (id: string, fn: () => unknown) => {
    if (store.get(id)) {
      report.unchanged.push(id);
      return;
    }
    try {
      fn();
      report.changed.push(id);
    } catch (e) {
      report.skipped.push(id);
      note(id, "action", `not added to the catalog: ${(e as Error).message}`);
    }
  };

  for (const [id, caps] of [...capabilities].sort()) {
    const existing = store.get(id);
    if (existing?.kind === "provider") {
      const missing = [...caps].filter(
        (c) => !existing.capabilities.includes(c)
      );
      if (missing.length)
        note(
          id,
          "action",
          `provider ${id} is in the catalog without ${missing.join(", ")}; models of that type were not added`
        );
    }
    add(id, () =>
      registry.addProvider({
        id,
        adapter: id,
        capabilities: [...caps].sort() as Registry.Capability[],
        credentialRef: credentialRefFor(id)
      })
    );
  }
  for (const [id, m] of [...models].sort()) {
    add(id, () =>
      registry.addModel({
        id,
        type: m.type,
        features: m.type === "llm" ? LLM_FEATURES : STREAMING,
        languages: [...m.languages].sort()
      })
    );
  }
  for (const [id, v] of [...voices].sort()) {
    add(id, () =>
      registry.addVoice({ id, models: [v.model], language: v.language })
    );
  }

  if (!options.dryRun) await persistent.flush();
  return report;
}
