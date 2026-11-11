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
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { parse, parseDocument } from "yaml";
import {
  priceOf,
  RateCard,
  rateCardSchema
} from "../../mods/billing/src/rateCards";

// Fonoster Cloud's catalog tool (#1241). ops/cloud/config/catalog.yaml is the source: every model
// carries its vendor `cost` per meter, its `source` and, when Fonoster charges other than cost, a
// `price`. `generate` writes what follows from it; `check` runs generate in memory and fails when
// anything committed differs from it.
//
//   npm run generate:catalog   # tsx tools/devkit/catalog.ts generate
//   npm run check:catalog      # tsx tools/devkit/catalog.ts check

const SOURCE = "ops/cloud/config/catalog.yaml";
const CLOUD = "ops/cloud/config/catalog.cloud.yaml";
const SNIPPETS = {
  tts: "docs-site/snippets/cloud-tts-models.mdx",
  llm: "docs-site/snippets/cloud-llm-models.mdx"
};
const CARDS = "mods/billing/rate-cards";
const RUN = "run npm run generate:catalog";
const DAY = 24 * 60 * 60 * 1000;
const LEAD_DAYS = 7;

/** The meters a model must price, by its type. */
const METERS: Record<string, string[]> = {
  llm: ["llm.tokens.in", "llm.tokens.cached", "llm.tokens.out"],
  stt: ["stt.seconds"],
  tts: ["tts.characters"]
};

/** How the docs tables name each feature id (mods/common/src/registry/features.ts). */
const FEATURE_WORDS: Record<string, string> = {
  streaming: "streaming",
  "tool-calling": "tool calling",
  "json-mode": "JSON mode",
  vision: "vision",
  reasoning: "reasoning",
  "reasoning-low": "low reasoning",
  "fixed-sampling": "fixed sampling",
  "word-timings": "word timings",
  ssml: "SSML"
};

export type CatalogOptions = {
  /** The repository root. */
  root: string;
  /** Today, in UTC; only its date counts. */
  today: Date;
  /** Whether a path (relative to root) is on the base branch, origin/main. */
  onBaseBranch: (rel: string) => boolean;
};

type Cost = { usd: number; per: number };
type Entry = {
  kind: string;
  id: string;
  label?: string;
  type?: string;
  features?: string[];
  state?: string;
  replacement?: string;
  retireOn?: string;
  cost?: Record<string, Cost>;
  price?: Record<string, Cost>;
  source?: string;
};
type Card = { name: string; rel: string; card: RateCard };
type Derived = {
  meter: string;
  provider: string;
  model: string;
  credits: number;
  source: string;
};

const round = (n: number | undefined) => n?.toFixed(10);
const credits = ({ usd, per }: Cost) => Number((usd / per / 0.01).toFixed(10));
const midnight = (d: Date) =>
  Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const providerOf = (id: string) => id.split("/")[0];
const priced = (e: Entry) =>
  e.kind === "model" && (e.state === "active" || e.state === "deprecated");

/** One problem line per model that can't be priced: a missing cost or source, a foreign meter. */
function validate(entries: Entry[]): string[] {
  const out: string[] = [];
  for (const e of entries.filter(priced)) {
    const meters = METERS[e.type ?? ""] ?? [];
    for (const m of meters)
      if (!e.cost?.[m]) out.push(`${SOURCE}: ${e.id} has no cost for ${m}`);
    for (const m of new Set([
      ...Object.keys(e.cost ?? {}),
      ...Object.keys(e.price ?? {})
    ]))
      if (!meters.includes(m))
        out.push(`${SOURCE}: ${e.id}: ${m} is not a ${e.type} meter`);
    if (!e.source) out.push(`${SOURCE}: ${e.id} has no source`);
  }
  return out;
}

/** Each (meter, model) price in credits per unit: `price` where set, else `cost`. */
function derive(entries: Entry[]): Derived[] {
  return entries.filter(priced).flatMap((e) =>
    Object.keys(e.cost ?? {}).map((meter) => ({
      meter,
      provider: providerOf(e.id),
      model: e.id,
      credits: credits(e.price?.[meter] ?? e.cost![meter]),
      source: e.source!
    }))
  );
}

const differs = (card: RateCard, d: Derived) =>
  round(priceOf(card, d.meter, d.provider, d.model)) !== round(d.credits);

/** A scalar on a flow-style line: plain when it reads back as the same string. */
function scalar(v: unknown): string {
  if (typeof v !== "string") return String(v);
  return /^[A-Za-z0-9._/-]+$/.test(v) && parse(v) === v ? v : JSON.stringify(v);
}

function flow(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(flow).join(", ")}]`;
  if (v && typeof v === "object") {
    const pairs = Object.entries(v).map(([k, x]) => `${scalar(k)}: ${flow(x)}`);
    return pairs.length ? `{ ${pairs.join(", ")} }` : "{}";
  }
  return scalar(v);
}

function cloudCatalog(entries: Entry[]): string {
  const lines = entries.map((e) => {
    const { cost: _c, price: _p, source: _s, ...rest } = e;
    return `  - ${flow(rest)}`;
  });
  return [
    `# Generated from ${SOURCE} by npm run generate:catalog. Do not edit.`,
    "entries:",
    ...lines,
    ""
  ].join("\n");
}

function snippet(entries: Entry[], type: "tts" | "llm"): string {
  const vendors = new Map(
    entries.filter((e) => e.kind === "provider").map((e) => [e.id, e.label])
  );
  const rows = entries
    .filter((e) => priced(e) && e.type === type)
    .map((e) => {
      const words = (e.features ?? [])
        .map((f) => FEATURE_WORDS[f] ?? f)
        .join(", ");
      let features = words.charAt(0).toUpperCase() + words.slice(1);
      if (e.state === "deprecated")
        features += `; deprecated, retires on ${String(e.retireOn).slice(0, 10)}; use \`${e.replacement}\` instead`;
      return `| \`${e.id}\` | ${vendors.get(providerOf(e.id))} | ${features} |`;
    });
  return [
    `{/* Generated from ${SOURCE} by npm run generate:catalog. Do not edit. */}`,
    "",
    "| Catalog ID | Vendor | Features |",
    "| --- | --- | --- |",
    ...rows,
    ""
  ].join("\n");
}

/** Every card in the directory, oldest start first (as loadRateCards orders them). */
function readCards(root: string): Card[] {
  return fs
    .readdirSync(path.join(root, CARDS))
    .filter((f) => /\.ya?ml$/.test(f))
    .map((name) => {
      const rel = `${CARDS}/${name}`;
      const text = fs.readFileSync(path.join(root, rel), "utf8");
      try {
        return { name, rel, card: rateCardSchema.parse(parse(text)) };
      } catch (e) {
        throw new Error(`rate card ${name}: ${(e as Error).message}`);
      }
    })
    .sort((a, b) => a.card.startsAt.getTime() - b.card.startsAt.getTime());
}

/** The base card: the newest one on the base branch. */
function baseOf(cards: Card[], opts: CatalogOptions): Card {
  const base = cards.filter((c) => opts.onBaseBranch(c.rel)).at(-1);
  if (!base) throw new Error(`${CARDS}: no rate card on the base branch`);
  return base;
}

/** The next card from the base, or undefined when every derived price matches it. */
function nextCard(
  root: string,
  base: Card,
  derived: Derived[],
  today: Date
): { rel: string; text: string } | undefined {
  const changed = derived.filter((d) => differs(base.card, d));
  if (!changed.length) return undefined;
  const existing = changed.some(
    (d) => priceOf(base.card, d.meter, d.provider, d.model) !== undefined
  );
  let starts = midnight(today) + DAY + (existing ? LEAD_DAYS * DAY : 0);
  const baseStart = base.card.startsAt.getTime();
  if (starts <= baseStart) starts = midnight(base.card.startsAt) + DAY;

  const doc = parseDocument(fs.readFileSync(path.join(root, base.rel), "utf8"));
  for (const d of changed)
    doc.setIn(["prices", d.meter, d.provider, d.model], d.credits);
  const sources = [...new Set(changed.map((d) => d.source))].join("; ");
  doc.set("version", base.card.version + 1);
  doc.set("startsAt", `${ymd(starts)}T00:00:00Z`);
  doc.set("source", `Generated from ${SOURCE} (${sources})`);
  // The base card's header describes the base card; this one gets its own.
  const contents = doc.contents as { commentBefore?: string | null } | null;
  if (contents) contents.commentBefore = null;
  const first = (doc.contents as { items?: { key?: unknown }[] } | null)
    ?.items?.[0]?.key as { commentBefore?: string | null } | undefined;
  if (first) first.commentBefore = null;
  doc.commentBefore = ` Generated from ${SOURCE} by npm run generate:catalog. Never edit a card once it starts: change the catalog and generate the next one.`;
  const text = doc.toString({ lineWidth: 0 });
  rateCardSchema.parse(parse(text));
  return { rel: `${CARDS}/${ymd(starts).replace(/-/g, "")}.yaml`, text };
}

function readOrNull(root: string, rel: string): string | null {
  const file = path.join(root, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

function readSource(root: string): Entry[] {
  return (
    parse(fs.readFileSync(path.join(root, SOURCE), "utf8")) as {
      entries: Entry[];
    }
  ).entries;
}

/** What generate would leave on disk: files by path, and the cards it would delete. */
function plan(opts: CatalogOptions) {
  const entries = readSource(opts.root);
  const problems = validate(entries);
  const files: Record<string, string> = {
    [CLOUD]: cloudCatalog(entries),
    [SNIPPETS.tts]: snippet(entries, "tts"),
    [SNIPPETS.llm]: snippet(entries, "llm")
  };
  if (problems.length) return { entries, problems, files, deleted: [] };
  const cards = readCards(opts.root);
  const base = baseOf(cards, opts);
  const card = nextCard(opts.root, base, derive(entries), opts.today);
  if (card) files[card.rel] = card.text;
  // A card the base branch doesn't have is this branch's own: computed again from the base.
  const deleted = cards
    .filter((c) => !opts.onBaseBranch(c.rel) && c.rel !== card?.rel)
    .map((c) => c.rel);
  return { entries, problems, files, deleted };
}

/**
 * Writes catalog.cloud.yaml, the docs tables and, when a derived price differs from the base card,
 * the next rate card. With `dryRun`, it only returns what it would write.
 */
export function generate(opts: CatalogOptions & { dryRun?: boolean }): {
  files: Record<string, string>;
  written: string[];
  deleted: string[];
} {
  const { problems, files, deleted } = plan(opts);
  if (problems.length) throw new Error(problems.join("\n"));
  const written = Object.keys(files).filter(
    (rel) => readOrNull(opts.root, rel) !== files[rel]
  );
  if (!opts.dryRun) {
    for (const rel of written) {
      const file = path.join(opts.root, rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, files[rel]);
    }
    for (const rel of deleted) fs.rmSync(path.join(opts.root, rel));
  }
  return { files, written, deleted };
}

/** Runs generate in memory: 0 when everything committed matches it, else 1 and one line each. */
export function check(opts: CatalogOptions): { code: 0 | 1; lines: string[] } {
  const { entries, problems, files } = plan(opts);
  const lines = [...problems];
  for (const rel of [CLOUD, SNIPPETS.tts, SNIPPETS.llm])
    if (readOrNull(opts.root, rel) !== files[rel])
      lines.push(`${rel} is stale: ${RUN}`);
  if (!problems.length) {
    const derived = derive(entries);
    const cards = readCards(opts.root);
    const base = baseOf(cards, opts);
    const newest = cards.at(-1)!;
    if (derived.some((d) => differs(newest.card, d)))
      lines.push(`${CARDS}: prices differ from ${newest.name}: ${RUN}`);
    const own = cards.filter((c) => !opts.onBaseBranch(c.rel));
    if (own.includes(newest)) {
      const changesExisting = derived.some(
        (d) =>
          priceOf(base.card, d.meter, d.provider, d.model) !== undefined &&
          round(priceOf(base.card, d.meter, d.provider, d.model)) !==
            round(priceOf(newest.card, d.meter, d.provider, d.model))
      );
      const starts = newest.card.startsAt.getTime();
      if (changesExisting && starts < midnight(opts.today) + LEAD_DAYS * DAY)
        lines.push(
          `${newest.rel}: changes an existing price and starts ${ymd(starts)}, less than ${LEAD_DAYS} days from today: ${RUN}`
        );
    }
    for (const c of own)
      if (
        c.card.version !== base.card.version + 1 ||
        c.card.startsAt.getTime() <= base.card.startsAt.getTime()
      )
        lines.push(
          `${c.rel}: version ${c.card.version} is not one more than the base card ${base.name} (version ${base.card.version}): ${RUN}`
        );
  }
  return { code: lines.length ? 1 : 0, lines };
}

function main(command: string | undefined) {
  const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../.."
  );
  const opts: CatalogOptions = {
    root,
    today: new Date(),
    onBaseBranch: (rel) => {
      try {
        execFileSync("git", ["cat-file", "-e", `origin/main:${rel}`], {
          cwd: root,
          stdio: "ignore"
        });
        return true;
      } catch {
        return false;
      }
    }
  };
  if (command === "generate") {
    const { written, deleted } = generate(opts);
    for (const rel of deleted) console.log(`deleted ${rel}`);
    for (const rel of written) console.log(`wrote ${rel}`);
    return 0;
  }
  if (command === "check") {
    const { code, lines } = check(opts);
    for (const line of lines) console.log(line);
    return code;
  }
  console.error("usage: tsx tools/devkit/catalog.ts generate|check");
  return 1;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    process.exitCode = main(process.argv[2]);
  } catch (e) {
    console.error((e as Error).message);
    process.exitCode = 1;
  }
}
