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
import * as fs from "fs";
import { parse } from "yaml";
import { RegistryError } from "./Registry";
import { CatalogEntry, VoiceEntry } from "./types";

// `fonoster-registry sync-voices` (#1323): writes a vendor's voices into a catalog file, for that
// vendor's TTS models already listed there. It writes the file only, never a store, and changes
// only that vendor's voice lines: every other line and comment stays byte for byte, and voices the
// vendor no longer offers stay (and are reported). Vendors are asked with plain fetch; this
// package does not depend on @fonoster/community.

export type SyncFetch = (
  url: string,
  init: { headers: Record<string, string> }
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export type SyncDeps = {
  fetch?: SyncFetch;
  env?: Record<string, string | undefined>;
};

export const SYNC_VENDORS: Record<string, { keyVariable: string }> = {
  deepgram: { keyVariable: "DEEPGRAM_API_KEY" },
  elevenlabs: { keyVariable: "ELEVENLABS_API_KEY" }
};

/** A vendor's voice, before it is limited to the models in the file. */
type Offered = Omit<VoiceEntry, "kind" | "state">;

type DeepgramVoice = {
  name: string;
  canonical_name: string;
  architecture: string;
  languages?: string[];
  metadata?: {
    accent?: string | null;
    display_name?: string | null;
    tags?: string[];
  };
};

type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  category: string;
  labels?: Record<string, string>;
  verified_languages?: { locale?: string }[];
};

async function getJson(
  fetch: SyncFetch,
  url: string,
  headers: Record<string, string>
) {
  const res = await fetch(url, { headers });
  if (!res.ok)
    throw new RegistryError(`GET ${url.split("?")[0]} failed: ${res.status}`);
  return res.json();
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Flux voices from /v2/models and Aura voices from /v1/models; the model is the architecture's. */
async function deepgramVoices(
  fetch: SyncFetch,
  key: string,
  models: string[]
): Promise<Offered[]> {
  const headers = { Authorization: `Token ${key}` };
  const voices: DeepgramVoice[] = [];
  for (const version of ["v2", "v1"]) {
    const body = (await getJson(
      fetch,
      `https://api.deepgram.com/${version}/models`,
      headers
    )) as { tts?: DeepgramVoice[] };
    voices.push(...(body.tts ?? []));
  }
  const out = new Map<string, Offered>();
  for (const v of voices) {
    const model = `deepgram/${v.architecture.replace(/-tts$/, "")}`;
    const id = `deepgram/${v.canonical_name}`;
    if (!models.includes(model) || out.has(id)) continue;
    const languages = v.languages ?? [];
    const tags = v.metadata?.tags ?? [];
    out.set(id, {
      id,
      label: v.metadata?.display_name || capitalize(v.name),
      models: [model],
      language: languages.find((l) => l.includes("-")) ?? languages[0],
      gender: tags.includes("feminine")
        ? "female"
        : tags.includes("masculine")
          ? "male"
          : undefined,
      accent: v.metadata?.accent || undefined
    });
  }
  return [...out.values()];
}

/** ElevenLabs' premade voices, on every ElevenLabs model in the file. */
async function elevenLabsVoices(
  fetch: SyncFetch,
  key: string,
  models: string[]
): Promise<Offered[]> {
  const headers = { "xi-api-key": key };
  const voices: ElevenLabsVoice[] = [];
  let token: string | undefined;
  do {
    const url = `https://api.elevenlabs.io/v2/voices?page_size=100${
      token ? `&next_page_token=${encodeURIComponent(token)}` : ""
    }`;
    const body = (await getJson(fetch, url, headers)) as {
      voices: ElevenLabsVoice[];
      has_more?: boolean;
      next_page_token?: string | null;
    };
    voices.push(...body.voices);
    token = body.has_more ? (body.next_page_token ?? undefined) : undefined;
  } while (token);
  return voices
    .filter((v) => v.category === "premade")
    .map((v) => ({
      id: `elevenlabs/${v.voice_id}`,
      label: v.name.split(" - ")[0],
      models,
      language: v.verified_languages?.[0]?.locale || v.labels?.language,
      gender: v.labels?.gender,
      accent: v.labels?.accent
    }));
}

const plain = (v: string) =>
  /^[A-Za-z0-9._/-]+$/.test(v) ? v : JSON.stringify(v);

/** One flow-style catalog line, as the hand-written ones in ops/cloud/config/catalog.yaml. */
function voiceLine(indent: string, v: VoiceEntry) {
  const fields = [
    "kind: voice",
    `id: ${plain(v.id)}`,
    v.label !== undefined ? `label: ${JSON.stringify(v.label)}` : undefined,
    `models: [${v.models.map(plain).join(", ")}]`,
    v.language ? `language: ${plain(v.language)}` : undefined,
    v.gender ? `gender: ${plain(v.gender)}` : undefined,
    v.accent ? `accent: ${plain(v.accent)}` : undefined,
    `state: ${v.state}`,
    v.replacement ? `replacement: ${plain(v.replacement)}` : undefined,
    v.retireOn ? `retireOn: ${plain(v.retireOn)}` : undefined
  ].filter(Boolean);
  return `${indent}- { ${fields.join(", ")} }`;
}

const ENTRY_LINE = /^(\s*)- (\{.*\})\s*$/;

/** The catalog entry on a flow-style line, or undefined for any other line. */
function entryOn(line: string): CatalogEntry | undefined {
  const m = ENTRY_LINE.exec(line);
  if (!m) return undefined;
  try {
    return parse(m[2]) as CatalogEntry;
  } catch {
    return undefined;
  }
}

export type SyncResult = {
  text: string;
  /** Added voices by their first model, in the file's model order. */
  added: [string, number][];
  kept: number;
  noLongerOffered: string[];
};

/**
 * Merges the vendor's voices into the file: the provider's voice lines become one block, where the
 * first of them was (or after the last voice line), grouped by model in the file's order and
 * sorted by id. A voice still offered gets the vendor's fields and keeps its lifecycle.
 */
export function mergeVoices(
  text: string,
  provider: string,
  models: string[],
  offered: Offered[]
): SyncResult {
  const lines = text.split("\n");
  const mine = (e?: CatalogEntry): e is VoiceEntry =>
    e?.kind === "voice" && e.id.startsWith(`${provider}/`);
  const existing = new Map<string, { index: number; entry: VoiceEntry }>();
  lines.forEach((line, index) => {
    const e = entryOn(line);
    if (mine(e)) existing.set(e.id, { index, entry: e });
  });
  const indexes = [...existing.values()].map((x) => x.index);
  const lastEntry = lines.reduce(
    (last, line, i) => (entryOn(line)?.kind === "voice" ? i : last),
    -1
  );
  const at = indexes.length
    ? indexes[0]
    : lastEntry >= 0
      ? lastEntry + 1
      : lines.length - (lines[lines.length - 1] === "" ? 1 : 0);
  const indent =
    ENTRY_LINE.exec(lines[indexes[0] ?? lastEntry] ?? "")?.[1] ??
    ENTRY_LINE.exec(lines.find((l) => ENTRY_LINE.test(l)) ?? "")?.[1] ??
    "  ";

  const block: { model: number; id: string; line: string }[] = [];
  const order = (m: string[]) => {
    const i = models.indexOf(m[0]);
    return i < 0 ? models.length : i;
  };
  const added = new Map<string, number>();
  let kept = 0;
  for (const v of offered) {
    const have = existing.get(v.id)?.entry;
    const entry: VoiceEntry = {
      kind: "voice",
      ...v,
      state: have?.state ?? "active",
      replacement: have?.replacement,
      retireOn: have?.retireOn
    };
    if (have) kept++;
    else added.set(v.models[0], (added.get(v.models[0]) ?? 0) + 1);
    block.push({
      model: order(v.models),
      id: v.id,
      line: voiceLine(indent, entry)
    });
  }
  const offeredIds = new Set(offered.map((v) => v.id));
  const noLongerOffered: string[] = [];
  for (const { index, entry } of existing.values()) {
    if (offeredIds.has(entry.id)) continue;
    noLongerOffered.push(entry.id);
    block.push({
      model: order(entry.models),
      id: entry.id,
      line: lines[index]
    });
  }
  block.sort((a, b) => a.model - b.model || a.id.localeCompare(b.id));

  const skip = new Set(indexes);
  const out: string[] = [];
  lines.forEach((line, i) => {
    if (i === at) out.push(...block.map((b) => b.line));
    if (!skip.has(i)) out.push(line);
  });
  if (at >= lines.length) out.push(...block.map((b) => b.line));
  return {
    text: out.join("\n"),
    added: models
      .filter((m) => added.has(m))
      .map((m) => [m, added.get(m)!] as [string, number]),
    kept,
    noLongerOffered: noLongerOffered.sort()
  };
}

/** Asks the vendor for its voices and merges them into the catalog file's text. */
export async function syncVoices(
  provider: string,
  text: string,
  deps: SyncDeps = {}
): Promise<SyncResult> {
  const vendor = SYNC_VENDORS[provider];
  if (!vendor)
    throw new RegistryError(
      `sync-voices takes ${Object.keys(SYNC_VENDORS).join(" or ")}`
    );
  const env = deps.env ?? process.env;
  const key = env[vendor.keyVariable];
  if (!key) throw new RegistryError(`${vendor.keyVariable} is required`);
  const entries =
    (parse(text) as { entries?: CatalogEntry[] } | null)?.entries ?? [];
  const models = entries
    .filter(
      (e) =>
        e.kind === "model" &&
        e.type === "tts" &&
        e.state !== "retired" &&
        e.id.startsWith(`${provider}/`)
    )
    .map((e) => e.id);
  if (!models.length)
    throw new RegistryError(
      `the file lists no ${provider} tts models; add them first`
    );
  const fetch = deps.fetch ?? (globalThis.fetch as unknown as SyncFetch);
  const offered =
    provider === "deepgram"
      ? await deepgramVoices(fetch, key, models)
      : await elevenLabsVoices(fetch, key, models);
  return mergeVoices(text, provider, models, offered);
}

/** `sync-voices deepgram|elevenlabs -f <file>`: rewrites the file and prints what changed. */
export async function runSyncVoices(
  argv: string[],
  out: (s: string) => void = console.log,
  deps: SyncDeps & {
    readFile?: (path: string) => string;
    writeFile?: (path: string, text: string) => void;
  } = {}
): Promise<number> {
  const [, provider, ...rest] = argv;
  const at = rest.findIndex((a) => a === "-f" || a === "--f");
  const file = at >= 0 ? rest[at + 1] : undefined;
  try {
    if (!provider || !file)
      throw new RegistryError(
        "usage: sync-voices deepgram|elevenlabs -f <file>"
      );
    const read = deps.readFile ?? ((p: string) => fs.readFileSync(p, "utf8"));
    const write =
      deps.writeFile ?? ((p: string, t: string) => fs.writeFileSync(p, t));
    const result = await syncVoices(provider, read(file), deps);
    write(file, result.text);
    const total = result.added.reduce((n, [, c]) => n + c, 0);
    const detail =
      provider === "elevenlabs"
        ? "premade only"
        : result.added.map(([m, c]) => `${m} ${c}`).join(", ");
    out(`added ${total}${total && detail ? ` (${detail})` : ""}`);
    out(`kept ${result.kept}`);
    out(`no longer offered ${result.noLongerOffered.length}`);
    for (const id of result.noLongerOffered) out(`  ${id}`);
    return 0;
  } catch (e) {
    if (e instanceof RegistryError) {
      out(`error: ${e.message}`);
      return 1;
    }
    throw e;
  }
}
