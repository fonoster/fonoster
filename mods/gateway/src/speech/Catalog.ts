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
import { adapterFor, SttAdapter, TtsAdapter } from "@fonoster/community";
import {
  DEFAULTS,
  GatewayConfig,
  ProviderConfig,
  providerKey
} from "../config";

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

export type SttResolution = {
  adapter: SttAdapter;
  /** The provider's own model name; undefined uses the provider's configured model. */
  model?: string;
  id?: string;
  event?: VoiceResolution["event"];
  replacement?: string;
};

/** A workspace's own vendor keys (bring your own key, registry 3.2). */
export type WorkspaceKeySource = {
  get(workspaceRef: string, providerId: string): Promise<string | undefined>;
};

type Adapters = { tts?: TtsAdapter; stt?: SttAdapter };

/**
 * The adapters a provider gets with a given key, built by its catalog adapter id
 * (@fonoster/community). Keyless adapters (fake) are built without one.
 */
function buildAdapters(p: ProviderConfig, apiKey?: string): Adapters {
  const factories = adapterFor(p.adapter);
  if (!factories) return {};
  const timeoutMs = p.tts?.timeoutMs ?? DEFAULTS.ttsTimeoutMs;
  return {
    tts: p.capabilities.includes("tts")
      ? factories.tts?.({
          apiKey,
          url: p.tts?.url,
          model: p.tts?.model,
          timeoutMs
        })
      : undefined,
    stt: p.capabilities.includes("stt")
      ? factories.stt?.({ apiKey, url: p.stt?.url, model: p.stt?.model })
      : undefined
  };
}

/** Whether a provider's adapter works without a credential (fake). */
function keyless(p: ProviderConfig): boolean {
  return Boolean(adapterFor(p.adapter)?.keyless);
}

export class Catalog {
  private registry?: {
    store: RegistryNs.RegistryStore;
    registry: RegistryNs.Registry;
  };
  private tts = new Map<string, TtsAdapter>();
  private stt = new Map<string, SttAdapter>();
  /** Workspace keys found by `prepare`, by workspace then provider. */
  private workspaceKeys = new Map<string, Map<string, string>>();
  /** Adapters built with a workspace key, by provider and key. */
  private keyed = new Map<string, Adapters>();

  constructor(
    private readonly config: GatewayConfig,
    registryStore?: RegistryNs.RegistryStore,
    private readonly keySource?: WorkspaceKeySource
  ) {
    if (registryStore || config.registry?.file) {
      const store =
        registryStore ??
        new RegistryNs.FileRegistryStore(config.registry!.file!);
      this.registry = {
        store,
        registry: new RegistryNs.Registry({ store, actor: "gateway" })
      };
    }
    for (const [name, p] of Object.entries(config.providers ?? {})) {
      const apiKey = keyless(p) ? undefined : providerKey(p);
      if (!keyless(p) && !apiKey) continue;
      const built = buildAdapters(p, apiKey);
      if (built.tts) this.tts.set(name, built.tts);
      if (built.stt) this.stt.set(name, built.stt);
    }
  }

  /**
   * Looks up the workspace's own vendor keys at session start (registry 3.2): resolutions for
   * that workspace then use them instead of the platform keys. A lookup that fails or takes more
   * than a second falls back to the platform keys.
   */
  async prepare(workspaceRef?: string): Promise<void> {
    if (!this.keySource || !workspaceRef) return;
    const keys = new Map<string, string>();
    const names = Object.entries(this.config.providers ?? {})
      .filter(([, p]) => !keyless(p))
      .map(([name]) => name);
    await Promise.all(
      names.map(async (name) => {
        const key = await Promise.race([
          this.keySource!.get(workspaceRef, name).catch(() => undefined),
          new Promise<undefined>((r) => setTimeout(() => r(undefined), 1000))
        ]);
        if (key) keys.set(name, key);
      })
    );
    this.workspaceKeys.set(workspaceRef, keys);
  }

  /** The provider's adapters with the workspace's key, when it has one. */
  private forWorkspace(
    provider: string,
    workspaceRef?: string
  ): Adapters | undefined {
    const key = workspaceRef
      ? this.workspaceKeys.get(workspaceRef)?.get(provider)
      : undefined;
    const p = this.config.providers?.[provider];
    if (!key || !p) return undefined;
    const id = `${provider}\u0000${key}`;
    let built = this.keyed.get(id);
    if (!built) {
      built = buildAdapters(p, key);
      this.keyed.set(id, built);
    }
    return built;
  }

  /** Whether calls of this workspace use its own key for a provider (for the call record). */
  usesWorkspaceKey(provider: string, workspaceRef?: string): boolean {
    return Boolean(
      workspaceRef && this.workspaceKeys.get(workspaceRef)?.has(provider)
    );
  }

  /**
   * The TTS adapter and provider voice for a catalog voice id, or undefined if not in the catalog.
   * With a registry, retired ids resolve to their replacement and `event` says what to record.
   */
  resolveVoice(id: string, workspaceRef?: string): VoiceResolution | undefined {
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
    const adapter =
      this.forWorkspace(provider, workspaceRef)?.tts ?? this.tts.get(provider);
    const voices = this.config.providers[provider]?.voices;
    if (!adapter || (voices && !voices.includes(voice))) return undefined;
    return { adapter, voice, id: resolved, event, replacement };
  }

  /**
   * The STT adapter and provider model for an app's STT catalog id (`deepgram/nova-3`). Without an
   * id, the deployment's default STT provider with its configured model. With a registry the id
   * must be an STT model in the catalog; a retired one resolves to its replacement (VO-B4).
   */
  resolveStt(id?: string, workspaceRef?: string): SttResolution | undefined {
    if (!id) {
      const adapter = this.defaultStt(workspaceRef);
      return adapter && { adapter };
    }
    let resolved = id;
    let event: VoiceResolution["event"];
    let replacement: string | undefined;
    if (this.registry) {
      const entry = this.registry.store.get(id);
      if (!entry || entry.kind !== "model" || entry.type !== "stt")
        return undefined;
      const r = this.registry.registry.resolve(id);
      resolved = r.id;
      event = r.event;
      replacement = r.replacement;
    }
    const slash = resolved.indexOf("/");
    if (slash <= 0) return undefined;
    const provider = resolved.slice(0, slash);
    const adapter =
      this.forWorkspace(provider, workspaceRef)?.stt ?? this.stt.get(provider);
    if (!adapter) return undefined;
    return {
      adapter,
      model: resolved.slice(slash + 1),
      id: resolved,
      event,
      replacement
    };
  }

  /** The STT adapter for the gateway (one STT provider per deployment for now). */
  defaultStt(workspaceRef?: string): SttAdapter | undefined {
    const name =
      this.config.stt?.provider ??
      (this.stt.keys().next().value as string) ??
      // Keys only from the workspace or the cell (no platform key): the first STT provider.
      Object.entries(this.config.providers ?? {}).find(([, p]) =>
        p.capabilities.includes("stt")
      )?.[0];
    if (!name) return undefined;
    return this.forWorkspace(name, workspaceRef)?.stt ?? this.stt.get(name);
  }
}
