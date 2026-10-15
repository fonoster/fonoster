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
import { parse, stringify } from "yaml";
import { FEATURES, unknownFeatures } from "./features";
import {
  Capability,
  CatalogEntry,
  ItemKind,
  ModelEntry,
  ProviderEntry,
  RegistryStore,
  Usage,
  UsageSource,
  VoiceEntry
} from "./types";

/** Adapters that ship with this version (add-provider-registry, P2). */
export const BUILT_IN_ADAPTERS = [
  "deepgram",
  "elevenlabs",
  "google",
  "azure",
  "openai",
  "anthropic",
  "groq",
  "ollama",
  "fake"
];

// provider/name; the name may have its own slashes, as hosted models do (groq/openai/gpt-oss-120b).
const CATALOG_ID = /^[a-z0-9-]+(\/[A-Za-z0-9._-]+)+$/;
const REF = /^[a-z0-9][a-z0-9-]*$/;
const SECRET_KEY = /(api[-_]?key|secret|token|password|private[-_]?key)/i;
const SECRET_VALUE = /^(sk-|sk_|xox[abp]-|AKIA|AIza|-----BEGIN)/;

export class RegistryError extends Error {}

export type ImpactLine = { mark: "✓" | "✗" | "~"; text: string; count: number };
export type Impact = {
  lines: ImpactLine[];
  mappable: Usage[];
  unmappable: Usage[];
};

export type RegistryOptions = {
  store: RegistryStore;
  usages?: UsageSource;
  actor?: string;
  /** Allows the fake adapter (test deployments only; conformance "Implementations ship fake adapters"). */
  testMode?: boolean;
  now?: () => Date;
  /** The command line that made the change, stored in every audit entry (spec "Every write is audited"). */
  commandLine?: string;
};

const noUsages: UsageSource = {
  find: () => [],
  rewrite: () => true,
  notify: () => undefined
};

/** The registry operations behind the `fonoster-registry` utility. */
export class Registry {
  private readonly usages: UsageSource;

  constructor(private readonly options: RegistryOptions) {
    this.usages = options.usages ?? noUsages;
  }

  private get store() {
    return this.options.store;
  }

  private audit(
    action: string,
    target: string,
    details?: Record<string, unknown>
  ) {
    this.store.audit({
      at: (this.options.now?.() ?? new Date()).toISOString(),
      actor: this.options.actor ?? process.env.USER ?? "operator",
      action,
      target,
      details: this.options.commandLine
        ? { command: this.options.commandLine, ...details }
        : details
    });
  }

  /** Rejects anything that looks like a credential (the catalog never holds a secret). */
  private assertNoSecrets(input: Record<string, unknown>) {
    for (const [k, v] of Object.entries(input)) {
      if (
        SECRET_KEY.test(k) ||
        (typeof v === "string" && SECRET_VALUE.test(v))
      ) {
        throw new RegistryError(
          `secrets cannot be stored in the catalog (${k}); store keys as workspace Secrets or platform credentials and pass --credential-ref`
        );
      }
    }
  }

  private assertNew(id: string) {
    if (!CATALOG_ID.test(id) && !REF.test(id))
      throw new RegistryError(`invalid catalog id ${id}`);
    const existing = this.store.get(id);
    if (existing)
      throw new RegistryError(
        `catalog id ${id} already exists (state: ${existing.state})`
      );
  }

  private require<K extends ItemKind>(
    id: string,
    kind: K
  ): Extract<CatalogEntry, { kind: K }> {
    const e = this.store.get(id);
    if (!e || e.kind !== kind) throw new RegistryError(`no ${kind} ${id}`);
    return e as Extract<CatalogEntry, { kind: K }>;
  }

  // ---- add --------------------------------------------------------------------------

  addProvider(
    input: {
      id: string;
      adapter: string;
      capabilities: Capability[];
      credentialRef: string;
    } & Record<string, unknown>
  ) {
    this.assertNoSecrets(input);
    this.assertNew(input.id);
    if (!BUILT_IN_ADAPTERS.includes(input.adapter))
      throw new RegistryError(`unknown adapter: ${input.adapter}`);
    if (input.adapter === "fake" && !this.options.testMode) {
      throw new RegistryError(
        "the fake adapter is only available in test mode"
      );
    }
    if (!REF.test(input.credentialRef))
      throw new RegistryError(
        "credentialRef must be a name such as deepgram-default"
      );
    const entry: ProviderEntry = {
      kind: "provider",
      id: input.id,
      adapter: input.adapter,
      capabilities: input.capabilities,
      credentialRef: input.credentialRef,
      state: "active"
    };
    this.store.put(entry);
    this.audit("add-provider", entry.id, { entry, before: null, after: entry });
    return entry;
  }

  addModel(
    input: {
      id: string;
      type: Capability;
      features?: string[];
      languages?: string[];
      settings?: string[];
    } & Record<string, unknown>
  ) {
    this.assertNoSecrets(input);
    this.assertNew(input.id);
    this.requireProviderFor(input.id, input.type);
    const unknown = unknownFeatures(input.type, input.features ?? []);
    if (unknown.length)
      throw new RegistryError(
        `unknown ${input.type} features: ${unknown.join(", ")}`
      );
    const entry: ModelEntry = {
      kind: "model",
      id: input.id,
      type: input.type,
      features: input.features ?? [],
      languages: input.languages ?? [],
      settings: input.settings ?? [],
      state: "active"
    };
    this.store.put(entry);
    this.audit("add-model", entry.id, { entry, before: null, after: entry });
    return entry;
  }

  addVoice(
    input: {
      id: string;
      models: string[];
      language?: string;
      gender?: string;
      ownerWorkspace?: string;
    } & Record<string, unknown>
  ) {
    this.assertNoSecrets(input);
    this.assertNew(input.id);
    for (const m of input.models) {
      const model = this.require(m, "model");
      if (model.type !== "tts")
        throw new RegistryError(`${m} is not a tts model`);
    }
    const entry: VoiceEntry = {
      kind: "voice",
      id: input.id,
      models: input.models,
      language: input.language,
      gender: input.gender,
      ownerWorkspace: input.ownerWorkspace,
      state: "active"
    };
    this.store.put(entry);
    this.audit("add-voice", entry.id, { entry, before: null, after: entry });
    return entry;
  }

  private requireProviderFor(id: string, type: Capability) {
    const provider = this.store.get(id.split("/")[0]);
    if (!provider || provider.kind !== "provider")
      throw new RegistryError(`no provider ${id.split("/")[0]}`);
    if (!provider.capabilities.includes(type))
      throw new RegistryError(
        `provider ${provider.id} has no ${type} capability`
      );
  }

  // ---- impact, deprecate, retire ----------------------------------------------------

  /** What moving the usages of `id` to `replacement` would do (shared by deprecate and retire). */
  impact(
    id: string,
    replacement: string,
    voiceMap: Record<string, string> = {}
  ): Impact {
    const item = this.store.get(id);
    const repl = this.store.get(replacement);
    if (!item || !repl)
      throw new RegistryError(`unknown ${!item ? id : replacement}`);
    const usages = this.usages.find(id);
    const mappable: Usage[] = [];
    const unmappable: Usage[] = [];
    const counts = new Map<string, ImpactLine>();
    const bump = (key: string, line: Omit<ImpactLine, "count">) => {
      const l = counts.get(key) ?? { ...line, count: 0 };
      l.count++;
      counts.set(key, l);
    };

    for (const u of usages) {
      let ok = true;
      if (item.kind === "model" && repl.kind === "model") {
        const missing = u.requires.filter(
          (f) => FEATURES[repl.type][f] === "hard" && !repl.features.includes(f)
        );
        if (missing.length) {
          ok = false;
          bump(`req:${missing}`, {
            mark: "✗",
            text: `requires ${missing.join(", ")}, which ${replacement} lacks`
          });
        }
        if (u.voice) {
          const voice = this.store.get(u.voice) as VoiceEntry | undefined;
          const name = u.voice.split("/")[1] ?? u.voice;
          if (voice?.models.includes(replacement))
            bump(`v:${u.voice}`, {
              mark: "✓",
              text: `voice ${name} works on replacement`
            });
          else if (voiceMap[name])
            bump(`vm:${u.voice}`, {
              mark: "✓",
              text: `voice ${name} → ${voiceMap[name]}`
            });
          else {
            ok = false;
            const owned = voice?.ownerWorkspace
              ? ` (workspace ${voice.ownerWorkspace}'s own voice)`
              : "";
            bump(`vx:${u.voice}`, {
              mark: "✗",
              text: `voice ${name}${owned} only exists on ${id.split("/")[1]} → needs --voice-map ${name}=<voice>`
            });
          }
        }
        for (const s of u.settings.filter((s) => !repl.settings.includes(s))) {
          bump(`s:${s}`, {
            mark: "~",
            text: `setting "${s}" not supported, will be dropped (soft)`
          });
        }
      } else if (item.kind === "voice" && repl.kind === "voice") {
        if (u.model && !repl.models.includes(u.model)) {
          ok = false;
          bump(`m:${u.model}`, {
            mark: "✗",
            text: `${replacement} does not work on ${u.model}`
          });
        } else bump("ok", { mark: "✓", text: `works on the same model` });
      } else bump("ok", { mark: "✓", text: "config moves to the replacement" });
      (ok ? mappable : unmappable).push(u);
    }
    return { lines: [...counts.values()], mappable, unmappable };
  }

  deprecate(kind: ItemKind, id: string, replacement: string, retireOn: string) {
    const item = this.require(id, kind);
    const repl = this.store.get(replacement);
    if (
      !repl ||
      repl.kind !== kind ||
      repl.state !== "active" ||
      (kind === "model" &&
        (repl as ModelEntry).type !== (item as ModelEntry).type)
    ) {
      throw new RegistryError(`replacement must be an active ${kind}`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(retireOn))
      throw new RegistryError("--retire-on must be a date (YYYY-MM-DD)");
    const report = this.impact(id, replacement);
    const after = {
      ...item,
      state: "deprecated" as const,
      replacement,
      retireOn
    };
    this.store.put(after);
    this.audit(`deprecate-${kind}`, id, {
      replacement,
      retireOn,
      before: item,
      after
    });
    const workspaces = new Set(this.usages.find(id).map((u) => u.workspace));
    // One provider.deprecated notice per workspace (sent as a workspace webhook by the apiserver).
    for (const w of workspaces)
      this.usages.notify(w, {
        type: "provider.deprecated",
        id,
        replacement,
        retireOn
      });
    return report;
  }

  retire(kind: ItemKind, id: string, voiceMap: Record<string, string> = {}) {
    const item = this.require(id, kind);
    if (!item.replacement)
      throw new RegistryError(
        `${id} must be deprecated with a replacement before it is retired`
      );
    const report = this.impact(id, item.replacement, voiceMap);
    const repl = this.store.get(item.replacement)!;
    for (const u of report.mappable) {
      const name = u.voice?.split("/")[1];
      const voice =
        kind === "voice"
          ? item.replacement
          : name && voiceMap[name]
            ? `${u.voice!.split("/")[0]}/${voiceMap[name]}`
            : undefined;
      const dropSettings =
        repl.kind === "model"
          ? u.settings.filter((s) => !repl.settings.includes(s))
          : [];
      const change = {
        model: kind === "model" ? item.replacement : undefined,
        voice,
        dropSettings
      };
      if (this.usages.rewrite(u, change))
        this.audit("rewrite-config", id, {
          workspace: u.workspace,
          config: u.config,
          change
        });
    }
    for (const w of new Set(
      [...report.mappable, ...report.unmappable].map((u) => u.workspace)
    )) {
      this.usages.notify(w, {
        type: "provider.retired",
        id,
        replacement: item.replacement
      });
    }
    const after = { ...item, state: "retired" as const };
    this.store.put(after);
    this.audit(`retire-${kind}`, id, {
      before: item,
      after,
      replacement: item.replacement,
      unmappable: report.unmappable.length
    });
    return report;
  }

  /** What the gateway does with an id at session start: retired ids resolve to their replacement. */
  resolve(id: string): {
    id: string;
    event?: "provider.deprecated_used" | "provider.retired_used";
    replacement?: string;
  } {
    const e = this.store.get(id);
    if (!e) return { id };
    if (e.state === "retired" && e.replacement)
      return {
        ...this.resolve(e.replacement),
        event: "provider.retired_used",
        replacement: e.replacement
      };
    if (e.state === "deprecated")
      return {
        id,
        event: "provider.deprecated_used",
        replacement: e.replacement
      };
    return { id };
  }

  // ---- read ---------------------------------------------------------------------------

  show(id: string) {
    const e = this.store.get(id);
    if (!e) throw new RegistryError(`no catalog entry ${id}`);
    return e;
  }

  list(kind?: ItemKind) {
    return this.store.all().filter((e) => !kind || e.kind === kind);
  }

  /** Voices the dashboard offers for a model: active or deprecated voices that work on it. */
  voicesFor(modelId: string) {
    return this.store
      .all()
      .filter(
        (e): e is VoiceEntry =>
          e.kind === "voice" &&
          e.state !== "retired" &&
          e.models.includes(modelId)
      );
  }

  usage(id: string) {
    return this.usages.find(id);
  }

  history(id?: string) {
    return this.store.history(id);
  }

  // ---- export, plan, apply ----------------------------------------------------------

  /** The whole catalog, sorted and without secrets, as YAML. Byte-identical for equal catalogs. */
  export(): string {
    return stringify({
      format: "fonoster.catalog.v1",
      entries: this.store.all().map(canonical)
    });
  }

  plan(file: string): string[] {
    return this.diff(file).map((d) => d.line);
  }

  apply(file: string): string[] {
    const changes = this.diff(file);
    for (const c of changes) {
      const before = this.store.get(c.entry.id) ?? null;
      this.store.put(c.entry);
      this.audit("apply", c.entry.id, {
        change: c.line,
        before,
        after: c.entry
      });
    }
    return changes.length ? changes.map((c) => c.line) : ["no changes"];
  }

  private diff(file: string) {
    const target = (parse(file) as { entries: CatalogEntry[] }).entries;
    const out: { line: string; entry: CatalogEntry }[] = [];
    for (const want of target) {
      this.assertNoSecrets(want as unknown as Record<string, unknown>);
      const have = this.store.get(want.id);
      if (!have)
        out.push({ line: `+ add ${want.kind} ${want.id}`, entry: want });
      else if (
        JSON.stringify(canonical(have)) !== JSON.stringify(canonical(want))
      ) {
        const verb =
          have.state !== want.state
            ? want.state === "deprecated"
              ? "deprecate"
              : want.state === "retired"
                ? "retire"
                : "update"
            : "update";
        const to =
          want.replacement && have.state !== want.state
            ? ` → ${want.replacement}`
            : "";
        out.push({
          line: `~ ${verb} ${want.kind} ${want.id}${to}`,
          entry: want
        });
      }
    }
    return out;
  }
}

/** Keys in a fixed order and no undefined values, so exports compare byte for byte. */
function canonical(e: CatalogEntry): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(e)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
  );
}
