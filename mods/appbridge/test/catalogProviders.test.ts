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
import { Registry as RegistryNs } from "@fonoster/common";
import { expect } from "chai";
import { GatewayConfig } from "../src/config";
import { Catalog } from "../src/speech/Catalog";

// Catalog providers the gateway config does not list (fake-providers): keyless ones work with no
// key, others with the workspace's key; the config still overrides a catalog endpoint.

describe("@gateway/catalog providers", function () {
  const catalogStore = () => {
    const store = new RegistryNs.MemoryRegistryStore();
    new RegistryNs.Registry({ store, actor: "test" }).apply(`entries:
  - { kind: provider, id: fake, label: Fakes, adapter: fake, capabilities: [stt, tts, llm], endpoints: { tts: "http://fakes:7001", stt: "ws://fakes:7002", llm: "http://fakes:7003" }, state: active }
  - { kind: model, id: fake/tts, type: tts, features: [streaming], languages: [multi], settings: [], state: active }
  - { kind: model, id: fake/stt, type: stt, features: [streaming], languages: [multi], settings: [], state: active }
  - { kind: voice, id: fake/default, models: [fake/tts], language: multi, state: active }
  - { kind: provider, id: deepgram, adapter: deepgram, capabilities: [stt, tts], credentialRef: deepgram-default, endpoints: { tts: "https://catalog.deepgram.example" }, state: active }
  - { kind: model, id: deepgram/aura-2, type: tts, features: [streaming], languages: [en], settings: [], state: active }
  - { kind: voice, id: deepgram/aura-2-thalia-en, models: [deepgram/aura-2], language: en-US, state: active }
  - { kind: provider, id: elevenlabs, adapter: elevenlabs, capabilities: [tts], credentialRef: elevenlabs-default, state: active }
  - { kind: model, id: elevenlabs/eleven_flash_v2_5, type: tts, features: [streaming], languages: [multi], settings: [], state: active }
  - { kind: voice, id: elevenlabs/rachel, models: [elevenlabs/eleven_flash_v2_5], language: multi, state: active }
`);
    return store;
  };
  const options = (adapter: unknown) =>
    (adapter as { options: Record<string, unknown> }).options;

  it("uses a keyless catalog provider with no gateway config, at its catalog endpoints", function () {
    const catalog = new Catalog(
      { nats: { url: "nats://x" }, providers: {} } as GatewayConfig,
      catalogStore()
    );
    const voice = catalog.resolveVoice("fake/default");
    expect(voice?.voice).to.equal("default");
    expect(options(voice!.adapter)).to.include({ url: "http://fakes:7001" });
    expect(catalog.resolveStt("fake/stt")?.model).to.equal("stt");
    // The same adapters on the next call, until the catalog entry changes.
    expect(catalog.resolveVoice("fake/default")!.adapter).to.equal(
      voice!.adapter
    );
  });

  it("reaches a provider missing from the gateway config with the workspace's key only", async function () {
    const catalog = new Catalog(
      { nats: { url: "nats://x" }, providers: {} } as GatewayConfig,
      catalogStore(),
      {
        get: async (workspaceRef, providerId) =>
          workspaceRef === "WO1" && providerId === "elevenlabs"
            ? "ws-el-key"
            : undefined
      }
    );
    await catalog.prepare("WO1");
    await catalog.prepare("WO2");
    expect(
      options(catalog.resolveVoice("elevenlabs/rachel", "WO1")!.adapter)
    ).to.include({ apiKey: "ws-el-key" });
    expect(catalog.resolveVoice("elevenlabs/rachel", "WO2")).to.equal(
      undefined
    );
  });

  it("lets the gateway config override a catalog endpoint", function () {
    const providers = (tts?: { url: string }) => ({
      deepgram: {
        adapter: "deepgram",
        capabilities: ["tts" as const],
        credential: { value: "platform-key" },
        ...(tts ? { tts } : {})
      }
    });
    const from = (config: ReturnType<typeof providers>) =>
      options(
        new Catalog(
          { nats: { url: "nats://x" }, providers: config } as GatewayConfig,
          catalogStore()
        ).resolveVoice("deepgram/aura-2-thalia-en")!.adapter
      ).baseUrl;
    expect(from(providers())).to.equal("https://catalog.deepgram.example");
    expect(from(providers({ url: "http://proxy:8080" }))).to.equal(
      "http://proxy:8080"
    );
  });

  it("defaults to a keyless STT provider when no other has a platform key", function () {
    const catalog = new Catalog(
      {
        nats: { url: "nats://x" },
        providers: {
          deepgram: { adapter: "deepgram", capabilities: ["stt"] }
        }
      } as GatewayConfig,
      catalogStore()
    );
    const stt = catalog.resolveStt();
    expect(options(stt!.adapter)).to.include({ url: "ws://fakes:7002" });
  });
});
