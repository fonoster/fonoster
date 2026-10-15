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
import { DEFAULTS, GatewayConfig, providerKey } from "../config";
import { DeepgramSttAdapter, DeepgramTtsAdapter } from "./deepgram";
import { ElevenLabsTtsAdapter } from "./elevenlabs";
import { FakeSttAdapter, FakeTtsAdapter } from "./fake";
import { SttAdapter, TtsAdapter } from "./types";

/**
 * Resolves catalog ids (`<provider>/<voice>`) to adapters. A stand-in for the provider registry
 * (add-provider-registry): providers and voices come from the gateway config for now.
 */
export type VoiceResolution = {
  adapter: TtsAdapter;
  /** The provider's own voice name. */
  voice: string;
  /** The catalog id actually used (the replacement, for a retired id). */
  id: string;
  event?: "provider.deprecated_used" | "provider.retired_used";
  replacement?: string;
};

export class Catalog {
  private registry?: {
    store: RegistryNs.FileRegistryStore;
    registry: RegistryNs.Registry;
  };
  private tts = new Map<string, TtsAdapter>();
  private stt = new Map<string, SttAdapter>();

  constructor(private readonly config: GatewayConfig) {
    if (config.registry) {
      const store = new RegistryNs.FileRegistryStore(config.registry.file);
      this.registry = {
        store,
        registry: new RegistryNs.Registry({ store, actor: "gateway" })
      };
    }
    for (const [name, p] of Object.entries(config.providers ?? {})) {
      const tts = p.capabilities.includes("tts");
      const stt = p.capabilities.includes("stt");
      const timeoutMs = p.tts?.timeoutMs ?? DEFAULTS.ttsTimeoutMs;
      if (p.adapter === "fake") {
        if (tts && p.tts?.url)
          this.tts.set(name, new FakeTtsAdapter({ url: p.tts.url, timeoutMs }));
        if (stt && p.stt?.url)
          this.stt.set(name, new FakeSttAdapter({ url: p.stt.url }));
        continue;
      }
      const apiKey = providerKey(p);
      if (!apiKey) continue;
      if (p.adapter === "deepgram") {
        if (tts)
          this.tts.set(
            name,
            new DeepgramTtsAdapter({ apiKey, baseUrl: p.tts?.url, timeoutMs })
          );
        if (stt)
          this.stt.set(
            name,
            new DeepgramSttAdapter({
              apiKey,
              baseUrl: p.stt?.url,
              sttModel: p.stt?.model
            })
          );
      } else if (p.adapter === "elevenlabs" && tts) {
        this.tts.set(
          name,
          new ElevenLabsTtsAdapter({
            apiKey,
            baseUrl: p.tts?.url,
            model: p.tts?.model,
            timeoutMs
          })
        );
      }
    }
  }

  /**
   * The TTS adapter and provider voice for a catalog voice id, or undefined if not in the catalog.
   * With a registry, retired ids resolve to their replacement and `event` says what to record.
   */
  resolveVoice(id: string): VoiceResolution | undefined {
    let resolved = id;
    let event: VoiceResolution["event"];
    let replacement: string | undefined;
    if (this.registry) {
      const entry = this.registry.store.get(id);
      if (!entry || entry.kind !== "voice") return undefined;
      const r = this.registry.registry.resolve(id);
      resolved = r.id;
      event = r.event;
      replacement = r.replacement;
    }
    const slash = resolved.indexOf("/");
    if (slash <= 0) return undefined;
    const provider = resolved.slice(0, slash);
    const voice = resolved.slice(slash + 1);
    const adapter = this.tts.get(provider);
    const voices = this.config.providers[provider]?.voices;
    if (!adapter || (voices && !voices.includes(voice))) return undefined;
    return { adapter, voice, id: resolved, event, replacement };
  }

  /** The STT adapter for the gateway (one STT provider per deployment for now). */
  defaultStt(): SttAdapter | undefined {
    const name = this.config.stt?.provider;
    return name ? this.stt.get(name) : this.stt.values().next().value;
  }
}
