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
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { parse } from "yaml";
import { Registry as RegistryNs } from "@fonoster/common";
import { Catalog } from "../src";
import { DeepgramSttAdapter, DeepgramTtsAdapter } from "../src/speech/deepgram";
import { ElevenLabsTtsAdapter } from "../src/speech/elevenlabs";

// The vendor catalog seed (VO-B5): it applies cleanly, every entry would pass the registry's own
// add-* checks, and the gateway resolves the owner's speech defaults through it.
const SEED = path.resolve(
  __dirname,
  "../../../ops/rebuild/config/catalog-seed.yaml"
);

describe("@gateway catalog seed", function () {
  const text = fs.readFileSync(SEED, "utf8");
  const entries = (parse(text) as { entries: RegistryNs.CatalogEntry[] })
    .entries;

  it("every entry passes the registry's add checks", function () {
    const registry = new RegistryNs.Registry({
      store: new RegistryNs.MemoryRegistryStore(),
      actor: "test"
    });
    for (const e of entries) {
      if (e.kind === "provider") registry.addProvider(e);
      else if (e.kind === "model") registry.addModel(e);
      else registry.addVoice(e);
    }
    expect(registry.list().length).to.equal(entries.length);
  });

  it("the gateway resolves Deepgram and ElevenLabs defaults through it", function () {
    const file = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "seed-")),
      "registry.json"
    );
    const store = new RegistryNs.FileRegistryStore(file);
    new RegistryNs.Registry({ store, actor: "test" }).apply(text);
    const catalog = new Catalog(
      {
        nats: { url: "nats://x" },
        providers: {
          deepgram: {
            adapter: "deepgram",
            capabilities: ["stt", "tts"],
            credential: { value: "k" }
          },
          elevenlabs: {
            adapter: "elevenlabs",
            capabilities: ["tts"],
            credential: { value: "k" }
          }
        }
      },
      store
    );
    const dg = catalog.resolveVoice("deepgram/aura-2-thalia-en")!;
    expect(dg.adapter).to.be.instanceOf(DeepgramTtsAdapter);
    expect(dg.voice).to.equal("aura-2-thalia-en");
    const xi = catalog.resolveVoice("elevenlabs/EXAVITQu4vr4xnSDxMaL")!;
    expect(xi.adapter).to.be.instanceOf(ElevenLabsTtsAdapter);
    expect(xi.voice).to.equal("EXAVITQu4vr4xnSDxMaL");
    const stt = catalog.resolveStt("deepgram/nova-3")!;
    expect(stt.adapter).to.be.instanceOf(DeepgramSttAdapter);
    expect(stt.model).to.equal("nova-3");
    expect(catalog.resolveStt("deepgram/aura-2")).to.equal(undefined);
    // A retired STT model resolves to its replacement and says so (task 3.3).
    const registry = new RegistryNs.Registry({ store, actor: "test" });
    registry.deprecate(
      "model",
      "deepgram/nova-2-phonecall",
      "deepgram/nova-3",
      "2027-01-31"
    );
    registry.retire("model", "deepgram/nova-2-phonecall");
    expect(catalog.resolveStt("deepgram/nova-2-phonecall")).to.deep.include({
      model: "nova-3",
      event: "provider.retired_used",
      replacement: "deepgram/nova-3"
    });
    expect(catalog.resolveVoice("elevenlabs/unknown")).to.equal(undefined);
  });
});
