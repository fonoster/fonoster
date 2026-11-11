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
import * as path from "path";
import { expect } from "chai";
import { parse } from "yaml";
import { CatalogEntry, VoiceEntry } from "../../src/registry";
import { runSyncVoices, SyncFetch } from "../../src/registry/syncVoices";

// sync-voices against recorded vendor responses (trimmed to a few voices; private ElevenLabs
// voices replaced by placeholders) and a copy of Cloud's catalog file. No vendor is called.

const FIXTURES = path.join(__dirname, "fixtures");
const fixture = (name: string) =>
  fs.readFileSync(path.join(FIXTURES, name), "utf8");
const CATALOG = fixture("catalog.yaml");

const AURA_2_IDS = [
  "andromeda-en",
  "apollo-en",
  "aquila-es",
  "arcas-en",
  "asteria-en",
  "celeste-es",
  "draco-en",
  "estrella-es",
  "helena-en",
  "javier-es",
  "luna-en",
  "nestor-es",
  "orion-en",
  "selena-es",
  "thalia-en",
  "zeus-en"
].map((n) => `deepgram/aura-2-${n}`);

/** A fetch that answers from fixtures by URL and records each request. */
function recorded(routes: Record<string, string>) {
  const calls: { url: string; headers: Record<string, string> }[] = [];
  const fetch: SyncFetch = async (url, init) => {
    calls.push({ url, headers: init.headers });
    const name = routes[url];
    if (!name) return { ok: false, status: 404, json: async () => ({}) };
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(fixture(name))
    };
  };
  return { fetch, calls };
}

async function sync(
  provider: string,
  fetch: SyncFetch,
  env: Record<string, string>,
  file = CATALOG
) {
  let written: string | undefined;
  const out: string[] = [];
  const code = await runSyncVoices(
    ["sync-voices", provider, "-f", "catalog.yaml"],
    (s) => out.push(s),
    {
      fetch,
      env,
      readFile: () => file,
      writeFile: (_, text) => (written = text)
    }
  );
  return { code, out, written };
}

const entries = (text: string) =>
  (parse(text) as { entries: CatalogEntry[] }).entries;
const voice = (text: string, id: string) =>
  entries(text).find((e) => e.id === id) as VoiceEntry | undefined;
/** The file's lines without the given provider's voice lines. */
const otherLines = (text: string, provider: string) =>
  text.split("\n").filter((l) => !l.includes(`kind: voice, id: ${provider}/`));

describe("@common/registry sync-voices", function () {
  const deepgram = () =>
    recorded({
      "https://api.deepgram.com/v2/models": "deepgram-v2-models.json",
      "https://api.deepgram.com/v1/models": "deepgram-v1-models.json"
    });

  it("writes Deepgram's Flux and Aura-2 voices with the vendor's fields", async function () {
    const { fetch, calls } = deepgram();
    const { code, out, written } = await sync("deepgram", fetch, {
      DEEPGRAM_API_KEY: "dg-test"
    });
    expect(code).to.equal(0);
    expect(calls.map((c) => c.url)).to.deep.equal([
      "https://api.deepgram.com/v2/models",
      "https://api.deepgram.com/v1/models"
    ]);
    expect(calls[0].headers).to.deep.equal({ Authorization: "Token dg-test" });
    expect(out).to.deep.equal([
      "added 6 (deepgram/flux 4, deepgram/aura-2 2)",
      "kept 15",
      "no longer offered 1",
      "  deepgram/aura-2-zeus-en"
    ]);

    expect(voice(written!, "deepgram/flux-fernanda-es")).to.deep.equal({
      kind: "voice",
      id: "deepgram/flux-fernanda-es",
      label: "Fernanda",
      models: ["deepgram/flux"],
      language: "es-MX",
      gender: "female",
      accent: "Mexican",
      state: "active"
    });
    // No language with a region: the first one.
    expect(voice(written!, "deepgram/flux-afsana-bn")).to.include({
      language: "bn",
      accent: "Bangladeshi"
    });
    // No display name: the capitalized name.
    expect(voice(written!, "deepgram/aura-2-thalia-en")).to.deep.equal({
      kind: "voice",
      id: "deepgram/aura-2-thalia-en",
      label: "Thalia",
      models: ["deepgram/aura-2"],
      language: "en-US",
      gender: "female",
      accent: "American",
      state: "active"
    });
    // An Aura (v1) voice: its model isn't in the file.
    expect(voice(written!, "deepgram/aura-angus-en")).to.equal(undefined);
    expect(written).to.contain(
      '  - { kind: voice, id: deepgram/flux-fernanda-es, label: "Fernanda", models: [deepgram/flux], language: es-MX, gender: female, accent: Mexican, state: active }'
    );
  });

  it("keeps every other line byte for byte, and every Aura-2 id", async function () {
    const { written } = await sync("deepgram", deepgram().fetch, {
      DEEPGRAM_API_KEY: "dg-test"
    });
    expect(otherLines(written!, "deepgram")).to.deep.equal(
      otherLines(CATALOG, "deepgram")
    );
    const ids = entries(written!).map((e) => e.id);
    expect(ids).to.include.members(AURA_2_IDS);
    // The voice no longer offered stays as it was.
    const zeus = CATALOG.split("\n").find((l) =>
      l.includes("deepgram/aura-2-zeus-en")
    );
    expect(written!.split("\n")).to.include(zeus);
  });

  it("leaves a model's block-style lines and its cost byte for byte (#1241)", async function () {
    // Cloud's source catalog writes models in block style, with their vendor cost.
    const flow = CATALOG.split("\n").find((l) =>
      l.includes("kind: model, id: deepgram/flux,")
    )!;
    const languages = /languages: (\[[^\]]*\])/.exec(flow)![1];
    const block = [
      "  - kind: model",
      "    id: deepgram/flux",
      '    label: "Flux"',
      "    type: tts",
      "    features: [streaming]",
      `    languages: ${languages}`,
      "    settings: []",
      "    state: active",
      "    cost: { tts.characters: { usd: 0.045, per: 1000 } }",
      '    source: "https://deepgram.com/pricing (2026-11-07)"'
    ].join("\n");
    const file = CATALOG.replace(flow, block);

    const { code, written } = await sync(
      "deepgram",
      deepgram().fetch,
      { DEEPGRAM_API_KEY: "dg-test" },
      file
    );

    expect(code).to.equal(0);
    expect(written).to.contain(block);
    expect(otherLines(written!, "deepgram")).to.deep.equal(
      otherLines(file, "deepgram")
    );
    expect(voice(written!, "deepgram/flux-fernanda-es")?.models).to.deep.equal([
      "deepgram/flux"
    ]);
  });

  it("changes nothing on a second run", async function () {
    const env = { DEEPGRAM_API_KEY: "dg-test" };
    const first = await sync("deepgram", deepgram().fetch, env);
    const second = await sync("deepgram", deepgram().fetch, env, first.written);
    expect(second.written).to.equal(first.written);
    expect(second.out[0]).to.equal("added 0");
    expect(second.out[1]).to.equal("kept 21");
  });

  it("writes only ElevenLabs' premade voices, on both models, across pages", async function () {
    const { fetch, calls } = recorded({
      "https://api.elevenlabs.io/v2/voices?page_size=100":
        "elevenlabs-voices-1.json",
      "https://api.elevenlabs.io/v2/voices?page_size=100&next_page_token=page-2":
        "elevenlabs-voices-2.json"
    });
    const { code, out, written } = await sync("elevenlabs", fetch, {
      ELEVENLABS_API_KEY: "el-test"
    });
    expect(code).to.equal(0);
    expect(calls).to.have.length(2);
    expect(calls[0].headers).to.deep.equal({ "xi-api-key": "el-test" });
    expect(out).to.deep.equal([
      "added 4 (premade only)",
      "kept 0",
      "no longer offered 0"
    ]);
    const voices = entries(written!).filter(
      (e): e is VoiceEntry =>
        e.kind === "voice" && e.id.startsWith("elevenlabs/")
    );
    expect(voices.map((v) => v.label).sort()).to.deep.equal([
      "Adam",
      "George",
      "River",
      "Roger"
    ]);
    expect(voice(written!, "elevenlabs/JBFqnCBsd6RMkjVDRZzb")).to.deep.equal({
      kind: "voice",
      id: "elevenlabs/JBFqnCBsd6RMkjVDRZzb",
      label: "George",
      models: ["elevenlabs/eleven_v4_turbo", "elevenlabs/eleven_flash_v2_5"],
      language: "en-GB",
      gender: "male",
      accent: "british",
      state: "active"
    });
    // No verified language: labels.language.
    expect(voice(written!, "elevenlabs/pNInz6obpgDQGcFmaJgB")).to.include({
      language: "en"
    });
    expect(otherLines(written!, "elevenlabs")).to.deep.equal(
      otherLines(CATALOG, "elevenlabs")
    );
  });

  it("needs the vendor's key and its models in the file", async function () {
    const missingKey = await sync("deepgram", deepgram().fetch, {});
    expect(missingKey.code).to.equal(1);
    expect(missingKey.out).to.deep.equal([
      "error: DEEPGRAM_API_KEY is required"
    ]);
    expect(missingKey.written).to.equal(undefined);

    const noModels = await sync(
      "elevenlabs",
      deepgram().fetch,
      { ELEVENLABS_API_KEY: "el-test" },
      "entries:\n  - { kind: provider, id: elevenlabs, adapter: elevenlabs, capabilities: [tts], state: active }\n"
    );
    expect(noModels.code).to.equal(1);
    expect(noModels.out[0]).to.match(/no elevenlabs tts models/);
  });
});
