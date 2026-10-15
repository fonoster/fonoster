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
import { DEFAULTS, GatewayConfig } from "../config";
import { FakeSttAdapter, FakeTtsAdapter } from "./fake";
import { SttAdapter, TtsAdapter } from "./types";

/**
 * Resolves catalog ids (`<provider>/<voice>`) to adapters. A stand-in for the provider registry
 * (add-provider-registry): providers and voices come from the gateway config for now.
 */
export class Catalog {
  private tts = new Map<string, TtsAdapter>();
  private stt = new Map<string, SttAdapter>();

  constructor(private readonly config: GatewayConfig) {
    for (const [name, p] of Object.entries(config.providers ?? {})) {
      if (p.adapter !== "fake") continue;
      if (p.capabilities.includes("tts") && p.tts) {
        this.tts.set(
          name,
          new FakeTtsAdapter({
            url: p.tts.url,
            timeoutMs: p.tts.timeoutMs ?? DEFAULTS.ttsTimeoutMs
          })
        );
      }
      if (p.capabilities.includes("stt") && p.stt)
        this.stt.set(name, new FakeSttAdapter({ url: p.stt.url }));
    }
  }

  /** The TTS adapter and provider voice for a catalog voice id, or undefined if not in the catalog. */
  resolveVoice(id: string): { adapter: TtsAdapter; voice: string } | undefined {
    const slash = id.indexOf("/");
    if (slash <= 0) return undefined;
    const provider = id.slice(0, slash);
    const voice = id.slice(slash + 1);
    const adapter = this.tts.get(provider);
    const voices = this.config.providers[provider]?.voices;
    if (!adapter || (voices && !voices.includes(voice))) return undefined;
    return { adapter, voice };
  }

  /** The STT adapter for the gateway (one STT provider per deployment for now). */
  defaultStt(): SttAdapter | undefined {
    const name = this.config.stt?.provider;
    return name ? this.stt.get(name) : this.stt.values().next().value;
  }
}
