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
  AppBridgeConfig,
  DEFAULTS,
  ProviderConfig,
  providerKey
} from "../config";

/**
 * Resolves catalog ids (`<provider>/<voice>`) to adapters. A stand-in for the provider registry
 * (add-provider-registry): providers and voices come from AppBridge config for now.
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
  /** The provider used when no model id was given (the deployment's default STT). */
  provider?: string;
  /** The provider's own model name; undefined uses the provider's configured model. */
  model?: string;
  id?: string;
  event?: VoiceResolution["event"];
  replacement?: string;
};

/** A workspace's own vendor keys (bring your own key, registry 3.2). */
export type WorkspaceKeySource = {
  get(workspaceRef: string, providerId: string): Promise<string | undefined>;
  /**
   * `false` for a source whose keys must not be cached (a public region's keys, asked of the
   * region agent per call): adapters built with them are not kept for later calls.
   */
  readonly cacheable?: boolean;
};

/** Adapters built with workspace keys kept at most (least recently used go first). */
export const KEYED_ADAPTERS_MAX = 256;
/** A workspace key adapter unused this long is dropped. */
export const KEYED_ADAPTERS_IDLE_MS = 10 * 60_000;
/**
 * A workspace's keys found at session start are dropped this long after (no call outlives the
 * Roomr node's 4 h MaxDuration), so removed keys and finished workspaces do not stay forever.
 */
export const WORKSPACE_KEYS_HOLD_MS = 4 * 60 * 60_000 + 5 * 60_000;
/** How long a workspace key lookup may take before the provider counts as unavailable. */
export const KEY_LOOKUP_MS = 3000;

type Adapters = { tts?: TtsAdapter; stt?: SttAdapter };

/**
 * The adapters a provider gets with a given key, built by its catalog adapter id
 * (@fonoster/community). Keyless providers are built without one. `name` is the catalog provider
 * (e.g. together), which a rejected key names, not the adapter id it is served by.
 */
function buildAdapters(
  name: string,
  p: ProviderConfig,
  apiKey?: string
): Adapters {
  const factories = adapterFor(p.adapter);
  if (!factories) return {};
  const timeoutMs = p.tts?.timeoutMs ?? DEFAULTS.ttsTimeoutMs;
  return {
    tts: p.capabilities.includes("tts")
      ? factories.tts?.({
          provider: name,
          apiKey,
          url: p.tts?.url,
          model: p.tts?.model,
          timeoutMs
        })
      : undefined,
    stt: p.capabilities.includes("stt")
      ? factories.stt?.({
          provider: name,
          apiKey,
          url: p.stt?.url,
          model: p.stt?.model
        })
      : undefined
  };
}

/** A provider known only from the catalog: keyless when it names no credentialRef. */
type CatalogProvider = ProviderConfig & { keyless?: boolean };

/** Whether a provider works without a credential (its catalog entry or its adapter says so). */
function keyless(p: CatalogProvider): boolean {
  return p.keyless ?? Boolean(adapterFor(p.adapter)?.keyless);
}

export class Catalog {
  private registry?: {
    store: RegistryNs.RegistryStore;
    registry: RegistryNs.Registry;
  };
  private tts = new Map<string, TtsAdapter>();
  private stt = new Map<string, SttAdapter>();
  /**
   * Workspace keys found by `prepare`, by workspace then provider (insertion = prepare order),
   * and the providers whose lookup failed or timed out: those never fall back to the platform key
   * (remove-platform-key-fallback).
   */
  private workspaceKeys = new Map<
    string,
    { at: number; keys: Map<string, string>; failed: Set<string> }
  >();
  /** Adapters built with a workspace key, by provider and key (insertion = last use). */
  private keyed = new Map<string, { used: number; adapters: Adapters }>();
  /** Keyless catalog providers' adapters, by provider and its config (a catalog change rebuilds). */
  private keylessBuilt = new Map<string, Adapters>();
  /** The clock (tests). */
  now: () => number = Date.now;
  /** How long a key lookup may take (tests shorten it). */
  keyLookupMs = KEY_LOOKUP_MS;

  constructor(
    private readonly config: AppBridgeConfig,
    registryStore?: RegistryNs.RegistryStore,
    private readonly keySource?: WorkspaceKeySource
  ) {
    if (registryStore || config.registry?.file) {
      const store =
        registryStore ??
        new RegistryNs.FileRegistryStore(config.registry!.file!);
      this.registry = {
        store,
        registry: new RegistryNs.Registry({ store, actor: "appbridge" })
      };
    }
    for (const name of Object.keys(config.providers ?? {})) {
      // The YAML entry over the catalog's (endpoints), when the registry is loaded already.
      const p = this.providerConfig(name)!;
      const apiKey = keyless(p) ? undefined : providerKey(p);
      if (!keyless(p) && !apiKey) continue;
      const built = buildAdapters(name, p, apiKey);
      if (built.tts) this.tts.set(name, built.tts);
      if (built.stt) this.stt.set(name, built.stt);
    }
  }

  /**
   * Looks up the workspace's own vendor keys at session start (registry 3.2): resolutions for
   * that workspace then use them instead of the platform keys. Only a lookup that answers "no
   * key" lets a provider use the platform key; one that fails or takes longer than
   * KEY_LOOKUP_MS marks the provider unavailable for the workspace (remove-platform-key-fallback).
   */
  async prepare(workspaceRef?: string): Promise<void> {
    if (!this.keySource || !workspaceRef) return;
    const keys = new Map<string, string>();
    const failed = new Set<string>();
    const names = this.providerNames().filter((name) => {
      const p = this.providerConfig(name);
      return p && !keyless(p);
    });
    await Promise.all(
      names.map(async (name) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const result = await Promise.race([
          this.keySource!.get(workspaceRef, name).then(
            (key) => ({ key }),
            () => "failed" as const
          ),
          new Promise<"failed">((r) => {
            timer = setTimeout(() => r("failed"), this.keyLookupMs);
          })
        ]);
        clearTimeout(timer);
        if (result === "failed") failed.add(name);
        else if (result.key) keys.set(name, result.key);
      })
    );
    this.workspaceKeys.delete(workspaceRef);
    this.workspaceKeys.set(workspaceRef, { at: this.now(), keys, failed });
    this.prune();
  }

  /** Whether the workspace's key for a provider could not be read at session start. */
  keyUnavailable(provider: string, workspaceRef?: string): boolean {
    if (!workspaceRef) return false;
    const entry = this.workspaceKeys.get(workspaceRef);
    return Boolean(entry?.failed.has(provider));
  }

  /** The provider of the STT a session uses (its model's, or the deployment's default). */
  sttProvider(sttModel?: string): string | undefined {
    return sttModel ? sttModel.split("/")[0] : this.defaultSttProvider();
  }

  /** Drops expired workspace keys and idle or excess keyed adapters. */
  private prune() {
    const now = this.now();
    for (const [ref, entry] of this.workspaceKeys) {
      if (now - entry.at <= WORKSPACE_KEYS_HOLD_MS) break;
      this.workspaceKeys.delete(ref);
    }
    for (const [id, entry] of this.keyed) {
      if (
        this.keyed.size <= KEYED_ADAPTERS_MAX &&
        now - entry.used <= KEYED_ADAPTERS_IDLE_MS
      )
        break;
      this.keyed.delete(id);
    }
  }

  /** Workspace keys and keyed adapters held (tests). */
  get cached() {
    return { workspaces: this.workspaceKeys.size, adapters: this.keyed.size };
  }

  private keysOf(workspaceRef?: string) {
    if (!workspaceRef) return undefined;
    const entry = this.workspaceKeys.get(workspaceRef);
    if (!entry) return undefined;
    if (this.now() - entry.at > WORKSPACE_KEYS_HOLD_MS) {
      this.workspaceKeys.delete(workspaceRef);
      return undefined;
    }
    return entry.keys;
  }

  /** The provider's adapters with the workspace's key, when it has one. */
  private forWorkspace(
    provider: string,
    workspaceRef?: string
  ): Adapters | undefined {
    const key = this.keysOf(workspaceRef)?.get(provider);
    const p = key && this.providerConfig(provider);
    if (!key || !p) return undefined;
    // Keys that must not be cached are never kept past this resolution.
    if (this.keySource?.cacheable === false)
      return buildAdapters(provider, p, key);
    const id = `${provider}\u0000${key}`;
    const built =
      this.keyed.get(id)?.adapters ?? buildAdapters(provider, p, key);
    this.keyed.delete(id);
    this.keyed.set(id, { used: this.now(), adapters: built });
    this.prune();
    return built;
  }

  /** Whether calls of this workspace use its own key for a provider (for the call record). */
  usesWorkspaceKey(provider: string, workspaceRef?: string): boolean {
    return Boolean(this.keysOf(workspaceRef)?.has(provider));
  }

  /**
   * The credential a session uses for a provider the gateway calls itself, such as a
   * noise-cancelling (`nc`) provider: the workspace's own key when `prepare` found one, else the
   * platform key from the gateway config. Undefined when there is neither (registry "Each layer
   * resolves the credentials of the providers it calls").
   */
  credentialFor(provider: string, workspaceRef?: string): string | undefined {
    const own = this.keysOf(workspaceRef)?.get(provider);
    if (own) return own;
    if (this.keyUnavailable(provider, workspaceRef)) return undefined;
    const p = this.providerConfig(provider);
    return p && !keyless(p) ? providerKey(p) : undefined;
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
    if (this.keyUnavailable(provider, workspaceRef)) return undefined;
    const adapter =
      this.forWorkspace(provider, workspaceRef)?.tts ??
      this.platform(provider)?.tts;
    const voices = this.config.providers?.[provider]?.voices;
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
      const provider = this.defaultSttProvider();
      const adapter = this.defaultStt(workspaceRef);
      return adapter && { adapter, provider };
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
    if (this.keyUnavailable(provider, workspaceRef)) return undefined;
    const adapter =
      this.forWorkspace(provider, workspaceRef)?.stt ??
      this.platform(provider)?.stt;
    if (!adapter) return undefined;
    return {
      adapter,
      model: resolved.slice(slash + 1),
      id: resolved,
      event,
      replacement
    };
  }

  /** Providers in AppBridge config or the catalog. */
  private providerNames(): string[] {
    const names = new Set(Object.keys(this.config.providers ?? {}));
    for (const e of this.registry?.store.all() ?? [])
      if (e.kind === "provider") names.add(e.id);
    return [...names];
  }

  /**
   * A provider's config: AppBridge's YAML entry over its catalog entry (adapter, capabilities,
   * endpoints). The YAML wins, so operators can still override a vendor's endpoint or model. A
   * catalog provider needs no YAML entry; a retired one is not used.
   */
  private providerConfig(name: string): CatalogProvider | undefined {
    const yaml = this.config.providers?.[name];
    const entry = this.registry?.store.get(name);
    const p =
      entry?.kind === "provider" && entry.state !== "retired"
        ? entry
        : undefined;
    if (!p) return yaml;
    const capabilities = p.capabilities.filter(
      (c): c is "tts" | "stt" | "nc" => c === "tts" || c === "stt" || c === "nc"
    );
    if (!adapterFor(p.adapter)) return yaml;
    return {
      adapter: p.adapter,
      capabilities,
      ...(yaml ? {} : { keyless: !p.credentialRef }),
      ...yaml,
      tts: { url: p.endpoints?.tts, ...withoutUndefined(yaml?.tts) },
      stt: { url: p.endpoints?.stt, ...withoutUndefined(yaml?.stt) }
    };
  }

  /**
   * A provider's adapters with the platform's key: built at start for AppBridge's YAML
   * providers, and on first use for keyless catalog providers.
   */
  private platform(name: string): Adapters | undefined {
    const tts = this.tts.get(name);
    const stt = this.stt.get(name);
    if (tts || stt) return { tts, stt };
    if (this.config.providers?.[name]) return undefined;
    const p = this.providerConfig(name);
    if (!p || !keyless(p)) return undefined;
    const id = `${name}\u0000${JSON.stringify(p)}`;
    let built = this.keylessBuilt.get(id);
    if (!built) {
      for (const k of this.keylessBuilt.keys())
        if (k.startsWith(`${name}\u0000`)) this.keylessBuilt.delete(k);
      built = buildAdapters(name, p);
      this.keylessBuilt.set(id, built);
    }
    return built;
  }

  /** The STT adapter for AppBridge (one STT provider per deployment for now). */
  /** The provider of the deployment's default STT. */
  private defaultSttProvider(): string | undefined {
    const stt = (n: string) =>
      Boolean(this.providerConfig(n)?.capabilities.includes("stt"));
    return (
      this.config.stt?.provider ??
      (this.stt.keys().next().value as string) ??
      // No platform key: a keyless STT provider, else the first one (workspace or cell keys).
      this.providerNames().find(
        (n) => stt(n) && keyless(this.providerConfig(n)!)
      ) ??
      this.providerNames().find(stt)
    );
  }

  defaultStt(workspaceRef?: string): SttAdapter | undefined {
    const name = this.defaultSttProvider();
    if (!name || this.keyUnavailable(name, workspaceRef)) return undefined;
    return (
      this.forWorkspace(name, workspaceRef)?.stt ?? this.platform(name)?.stt
    );
  }
}

/** An object without its undefined values, so spreading it keeps earlier defaults. */
function withoutUndefined<T extends object>(o?: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(o ?? {}).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}
