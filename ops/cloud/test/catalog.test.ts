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
import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { parse, stringify } from "yaml";
import {
  loadRateCards,
  priceOf,
  RateCard,
  rateCardSchema
} from "../../../mods/billing/src/rateCards";
import { check, generate } from "../../../tools/devkit/catalog";

// The Cloud catalog tool (#1241): `npm run generate:catalog` writes catalog.cloud.yaml, the docs
// tables and the next rate card from ops/cloud/config/catalog.yaml; `npm run check:catalog` fails
// CI when any of them is missing or stale. Each case runs on a temp copy of the files it reads,
// with the date and the base branch injected.

const ROOT = path.join(__dirname, "../../..");
const SOURCE = "ops/cloud/config/catalog.yaml";
const CLOUD = "ops/cloud/config/catalog.cloud.yaml";
const TTS = "docs-site/snippets/cloud-tts-models.mdx";
const LLM = "docs-site/snippets/cloud-llm-models.mdx";
const CARDS = "mods/billing/rate-cards";
const MAIN = ["20261101.yaml", "20261110.yaml", "20261111.yaml"];

const read = (root: string, rel: string) =>
  fs.readFileSync(path.join(root, rel), "utf8");
const write = (root: string, rel: string, text: string) =>
  fs.writeFileSync(path.join(root, rel), text);
const edit = (root: string, rel: string, f: (s: string) => string) => {
  const before = read(root, rel);
  const after = f(before);
  expect(after, `edit of ${rel}`).to.not.equal(before);
  write(root, rel, after);
};
/** Edits one model's block in the source: from its `- kind: model` line to the next entry. */
const editModel = (root: string, id: string, f: (block: string) => string) =>
  edit(root, SOURCE, (text) => {
    const start = text.indexOf(`  - kind: model\n    id: ${id}\n`);
    expect(start, id).to.be.at.least(0);
    const end = text.indexOf("\n  - ", start + 1);
    return text.slice(0, start) + f(text.slice(start, end)) + text.slice(end);
  });

const day = (d: string) => new Date(`${d}T12:00:00Z`);
const onBase =
  (names: string[]) =>
  (rel: string): boolean =>
    rel.startsWith(`${CARDS}/`) && names.includes(path.basename(rel));

/** A temp copy of every file the tool reads or writes. */
function copy(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-"));
  for (const rel of [SOURCE, CLOUD, TTS, LLM]) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.copyFileSync(path.join(ROOT, rel), path.join(root, rel));
  }
  fs.mkdirSync(path.join(root, CARDS), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, CARDS)))
    fs.copyFileSync(path.join(ROOT, CARDS, f), path.join(root, CARDS, f));
  return root;
}

/** Every file under a root, by relative path. */
function snapshot(root: string, dir = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of fs.readdirSync(path.join(root, dir), {
    withFileTypes: true
  })) {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) Object.assign(out, snapshot(root, rel));
    else out[rel] = read(root, rel);
  }
  return out;
}

type Model = {
  kind: string;
  id: string;
  type: string;
  state: string;
  cost?: Record<string, { usd: number; per: number }>;
  price?: Record<string, { usd: number; per: number }>;
  source?: string;
};
const entriesOf = (text: string) =>
  (parse(text) as { entries: Model[] }).entries;
const cardsOf = (root: string) => loadRateCards(path.join(root, CARDS));
const three = () => cardsOf(ROOT).find((c) => c.version === 3)!;
const ten = (n: number | undefined) => n?.toFixed(10);

/** A card's YAML, as a test writes one by hand. */
const cardText = (card: RateCard, startsAt: string) =>
  stringify({ ...card, startsAt });
/** Card 3's prices with one key set, as a new card should carry them. */
function withPrice(
  card: RateCard,
  meter: string,
  provider: string,
  model: string,
  credits: number
) {
  const prices = structuredClone(card.prices) as Record<
    string,
    Record<string, Record<string, number>>
  >;
  prices[meter][provider][model] = credits;
  return prices;
}

const GPT_TEST = `  - kind: model
    id: openai/gpt-test
    label: "GPT Test"
    type: llm
    features: [streaming, tool-calling]
    languages: []
    settings: []
    state: active
    cost:
      llm.tokens.in: { usd: 1, per: 1000000 }
      llm.tokens.cached: { usd: 0.10, per: 1000000 }
      llm.tokens.out: { usd: 5, per: 1000000 }
    source: "https://example.com/pricing (2026-11-10)"
`;
const TEST_TTS = `  - kind: model
    id: deepgram/test-tts
    label: "Test TTS"
    type: tts
    features: [streaming]
    languages: [en]
    settings: []
    state: active
    cost: { tts.characters: { usd: 0.06, per: 1000 } }
    source: "https://example.com/pricing (2026-11-10)"
`;
const MINI_IN = "llm.tokens.in: { usd: 0.75, per: 1000000 }";
const raiseMini = (root: string) =>
  editModel(root, "openai/gpt-5.4-mini", (b) =>
    b.replace(MINI_IN, "llm.tokens.in: { usd: 0.80, per: 1000000 }")
  );

/** Runs generate on a copy and returns the one card it wrote, checking the cards on main. */
function generateOne(root: string, today: string, base = onBase(MAIN)) {
  generate({ root, today: day(today), onBaseBranch: base });
  for (const f of MAIN)
    expect(read(root, `${CARDS}/${f}`), f).to.equal(
      read(ROOT, `${CARDS}/${f}`)
    );
  const added = fs
    .readdirSync(path.join(root, CARDS))
    .filter((f) => !MAIN.includes(f));
  expect(added).to.have.length(1);
  const text = read(root, `${CARDS}/${added[0]}`);
  expect(text.split("\n")[0]).to.equal(
    "# Generated from ops/cloud/config/catalog.yaml by npm run generate:catalog. Never edit a card once it starts: change the catalog and generate the next one."
  );
  return { name: added[0], card: rateCardSchema.parse(parse(text)) };
}

describe("@ops[cloud catalog tool]", function () {
  it("generates exactly the committed catalog.cloud.yaml and docs tables, and no card", function () {
    // Act
    const out = generate({
      root: ROOT,
      today: day("2026-11-10"),
      onBaseBranch: () => true,
      dryRun: true
    });

    // Assert
    for (const rel of [CLOUD, TTS, LLM])
      expect(out.files[rel], rel).to.equal(read(ROOT, rel));
    expect(
      Object.keys(out.files).filter((f) => f.startsWith(CARDS))
    ).to.deep.equal([]);
    expect(out.deleted).to.deep.equal([]);
  });

  it("derives exactly card 3's price for every meter of every Cloud model", function () {
    const card = three();
    const models = entriesOf(read(ROOT, SOURCE)).filter(
      (e) => e.kind === "model" && ["active", "deprecated"].includes(e.state)
    );
    expect(models.length).to.be.at.least(14);
    for (const m of models) {
      const costs = { ...m.cost, ...m.price };
      const meters = {
        llm: ["llm.tokens.in", "llm.tokens.cached", "llm.tokens.out"],
        stt: ["stt.seconds"],
        tts: ["tts.characters"]
      }[m.type]!;
      expect(Object.keys(costs).sort(), m.id).to.deep.equal([...meters].sort());
      for (const [meter, { usd, per }] of Object.entries(costs))
        expect(
          ten(priceOf(card, meter, m.id.split("/")[0], m.id)),
          `${meter} ${m.id}`
        ).to.equal(ten(usd / per / 0.01));
    }
  });

  it("writes the source's entries without cost, price or source, one per line", function () {
    const text = read(ROOT, CLOUD);
    const lines = text.split("\n");
    expect(lines[0]).to.equal(
      "# Generated from ops/cloud/config/catalog.yaml by npm run generate:catalog. Do not edit."
    );
    expect(lines[1]).to.equal("entries:");
    expect(lines.slice(2).filter((l) => l !== "")).to.satisfy((ls: string[]) =>
      ls.every((l) => l.startsWith("  - { ") && l.endsWith(" }"))
    );
    const cloud = entriesOf(text) as unknown as Record<string, unknown>[];
    const source = entriesOf(read(ROOT, SOURCE)).map((e) => {
      const { cost: _c, price: _p, source: _s, ...rest } = e;
      return rest;
    });
    expect(cloud).to.deep.equal(source);
    for (const e of cloud)
      for (const k of ["cost", "price", "source"])
        expect(e, String(e.id)).to.not.have.property(k);
  });

  describe("rate cards", function () {
    it("writes card 4 a week ahead when a price changes", function () {
      // Arrange
      const root = copy();
      raiseMini(root);

      // Act
      const { name, card } = generateOne(root, "2026-11-10");

      // Assert
      expect(name).to.equal("20261118.yaml");
      expect(card.version).to.equal(4);
      expect(card.startsAt.toISOString()).to.equal("2026-11-18T00:00:00.000Z");
      expect(card.prices).to.deep.equal(
        withPrice(
          three(),
          "llm.tokens.in",
          "openai",
          "openai/gpt-5.4-mini",
          0.00008
        )
      );
      expect(card.source).to.equal(
        "Generated from ops/cloud/config/catalog.yaml (https://developers.openai.com/api/docs/pricing (2026-11-06))"
      );
    });

    it("writes a card for tomorrow when only a new model is priced", function () {
      const root = copy();
      edit(root, SOURCE, (s) => s + GPT_TEST);

      const { name, card } = generateOne(root, "2026-11-12");

      expect(name).to.equal("20261113.yaml");
      expect(card.version).to.equal(4);
      expect(card.startsAt.toISOString()).to.equal("2026-11-13T00:00:00.000Z");
      let prices = withPrice(
        three(),
        "llm.tokens.in",
        "openai",
        "openai/gpt-test",
        0.0001
      );
      prices = withPrice(
        { ...three(), prices },
        "llm.tokens.cached",
        "openai",
        "openai/gpt-test",
        0.00001
      );
      prices = withPrice(
        { ...three(), prices },
        "llm.tokens.out",
        "openai",
        "openai/gpt-test",
        0.0005
      );
      expect(card.prices).to.deep.equal(prices);
    });

    it("starts the day after the base card when tomorrow is not after it", function () {
      const root = copy();
      edit(root, SOURCE, (s) => s + GPT_TEST);

      const { name, card } = generateOne(root, "2026-11-10");

      expect(name).to.equal("20261112.yaml");
      expect(card.startsAt.toISOString()).to.equal("2026-11-12T00:00:00.000Z");
    });

    it("gives a week's notice to a new model a provider's * already prices", function () {
      const root = copy();
      edit(root, SOURCE, (s) => s + TEST_TTS);

      const { name, card } = generateOne(root, "2026-11-12");

      expect(name).to.equal("20261120.yaml");
      expect(card.version).to.equal(4);
      expect(card.prices).to.deep.equal(
        withPrice(
          three(),
          "tts.characters",
          "deepgram",
          "deepgram/test-tts",
          0.006
        )
      );
    });

    it("replaces the branch's own unmerged card, and check then passes", function () {
      // Arrange
      const root = copy();
      raiseMini(root);
      const mine = {
        ...three(),
        version: 4,
        prices: withPrice(
          three(),
          "llm.tokens.in",
          "openai",
          "openai/gpt-5.4-mini",
          0.00008
        )
      };
      write(
        root,
        `${CARDS}/20261113.yaml`,
        cardText(mine, "2026-11-13T00:00:00Z")
      );

      // Act
      const { name } = generateOne(root, "2026-11-12");

      // Assert
      expect(name).to.equal("20261120.yaml");
      expect(
        check({ root, today: day("2026-11-12"), onBaseBranch: onBase(MAIN) })
      ).to.deep.equal({ code: 0, lines: [] });
    });

    it("writes no card and changes no file when the source is unchanged", function () {
      const root = copy();
      const before = snapshot(root);

      generate({ root, today: day("2026-11-12"), onBaseBranch: onBase(MAIN) });

      expect(snapshot(root)).to.deep.equal(before);
    });
  });

  describe("check", function () {
    const run = (root: string, today = "2026-11-12", base = onBase(MAIN)) =>
      check({ root, today: day(today), onBaseBranch: base });
    const fails = (
      root: string,
      line: string,
      today?: string,
      base?: (p: string) => boolean
    ) => {
      const out = run(root, today, base);
      expect(out.code).to.equal(1);
      expect(out.lines).to.include(line);
    };

    it("passes on the committed tree", function () {
      expect(
        check({
          root: ROOT,
          today: day("2026-11-10"),
          onBaseBranch: () => true
        })
      ).to.deep.equal({ code: 0, lines: [] });
    });

    it("names a model missing one meter's cost", function () {
      const root = copy();
      editModel(root, "openai/gpt-6-sol", (b) =>
        b.replace("      llm.tokens.out: { usd: 10, per: 1000000 }\n", "")
      );
      fails(root, `${SOURCE}: openai/gpt-6-sol has no cost for llm.tokens.out`);
    });

    it("names a model with no source", function () {
      const root = copy();
      editModel(root, "openai/gpt-6-sol", (b) =>
        b.replace(/\n {4}source: .*/, "")
      );
      fails(root, `${SOURCE}: openai/gpt-6-sol has no source`);
    });

    it("names a cost under a meter not of the model's type", function () {
      const root = copy();
      editModel(root, "deepgram/flux", (b) =>
        b.replace(
          "cost: { ",
          "cost: { llm.tokens.in: { usd: 1, per: 1000000 }, "
        )
      );
      fails(root, `${SOURCE}: deepgram/flux: llm.tokens.in is not a tts meter`);
    });

    it("finds a stale catalog.cloud.yaml", function () {
      const root = copy();
      edit(root, CLOUD, (s) => s.replace("label: Flux,", "label: Fluxx,"));
      fails(root, `${CLOUD} is stale: run npm run generate:catalog`);
    });

    it("finds a stale docs table", function () {
      const root = copy();
      edit(root, LLM, (s) => s.replace("| OpenAI |", "| Open AI |"));
      fails(root, `${LLM} is stale: run npm run generate:catalog`);
    });

    it("finds a price change with no new card", function () {
      const root = copy();
      raiseMini(root);
      fails(
        root,
        "mods/billing/rate-cards: prices differ from 20261111.yaml: run npm run generate:catalog"
      );
    });

    it("finds an unmerged card that changes a price with less than a week's notice", function () {
      const root = copy();
      raiseMini(root);
      const mine = {
        ...three(),
        version: 4,
        prices: withPrice(
          three(),
          "llm.tokens.in",
          "openai",
          "openai/gpt-5.4-mini",
          0.00008
        )
      };
      write(
        root,
        `${CARDS}/20261113.yaml`,
        cardText(mine, "2026-11-13T00:00:00Z")
      );
      expect(run(root)).to.deep.equal({
        code: 1,
        lines: [
          "mods/billing/rate-cards/20261113.yaml: changes an existing price and starts 2026-11-13, less than 7 days from today: run npm run generate:catalog"
        ]
      });
    });

    it("finds an unmerged card computed from a base another card replaced", function () {
      // Arrange: card 4 (20261118) merged first; this branch's 20261113 is also version 4.
      const root = copy();
      const four = { ...three(), version: 4 };
      write(
        root,
        `${CARDS}/20261118.yaml`,
        cardText(four, "2026-11-18T00:00:00Z")
      );
      write(
        root,
        `${CARDS}/20261113.yaml`,
        cardText(four, "2026-11-13T00:00:00Z")
      );
      const merged = onBase([...MAIN, "20261118.yaml"]);

      // Act, Assert
      fails(
        root,
        "mods/billing/rate-cards/20261113.yaml: version 4 is not one more than the base card 20261118.yaml (version 4): run npm run generate:catalog",
        "2026-11-10",
        merged
      );
      expect(
        run(
          root,
          "2026-11-10",
          onBase([...MAIN, "20261118.yaml", "20261113.yaml"])
        )
      ).to.deep.equal({ code: 0, lines: [] });
    });
  });
});
