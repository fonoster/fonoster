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
import { Registry } from "@fonoster/common";
import { adapterFor, Think } from "@fonoster/community";
import { OPENAI_COMPATIBLE } from "@fonoster/community/openai";

// Language models through the provider registry (rework-autopilot A8, A11, task 3.1; registry
// PR6: Autopilot resolves its own LLM credential, AppBridge resolves speech). The agent
// names a catalog id; the registry says which provider serves it, through which adapter, with
// which credentialRef; a CredentialSource turns the ref into a key. No key lives in the
// agent config or in Autopilot's environment by name.

/** Where keys come from: workspace Secrets first (bring your own key), then platform keys. */
export interface CredentialSource {
  get(
    ref: string,
    scope: { workspaceRef?: string }
  ): Promise<string | undefined> | string | undefined;
}

/**
 * Platform credentials from operator config: `{ "<credentialRef>": { env } | { value } }`. The
 * variable names are operator choices; Autopilot never reads a vendor variable by itself.
 */
export class ConfigCredentials implements CredentialSource {
  constructor(
    private readonly refs: Record<string, { env?: string; value?: string }>
  ) {}

  get(ref: string) {
    const c = this.refs[ref];
    return c?.value ?? (c?.env ? process.env[c.env] : undefined);
  }
}

/**
 * A workspace's own key could not be read (its store failed). It never falls back to the platform
 * key (remove-platform-key-fallback): the session ends with reason key_unavailable.
 */
export class KeyUnavailableError extends Error {
  readonly reason = "key_unavailable";
  constructor(
    readonly ref: string,
    cause?: unknown
  ) {
    super(
      `the workspace's key ${ref} could not be read: ${(cause as Error)?.message ?? cause}`
    );
  }
}

/** A key and whose it is: the workspace's own (or its private region's), or the platform's. */
export type ResolvedCredential = {
  key: string;
  source: "workspace" | "platform";
};

/** Workspace Secrets (BYOK) in front of platform credentials. */
export class LayeredCredentials implements CredentialSource {
  constructor(private readonly sources: CredentialSource[]) {}

  async get(ref: string, scope: { workspaceRef?: string }) {
    return (await this.resolve(ref, scope))?.key;
  }

  /**
   * The first key found and whose it is (add-usage-metering): the operator's config holds the
   * platform keys; every other source holds the workspace's own.
   */
  async resolve(
    ref: string,
    scope: { workspaceRef?: string }
  ): Promise<ResolvedCredential | undefined> {
    for (const s of this.sources) {
      let key: string | undefined;
      try {
        key = await s.get(ref, scope);
      } catch (e) {
        if (s instanceof ConfigCredentials) throw e;
        throw new KeyUnavailableError(ref, e);
      }
      if (key)
        return {
          key,
          source: s instanceof ConfigCredentials ? "platform" : "workspace"
        };
    }
    return undefined;
  }
}

/** A credential and its source; a source that cannot tell is the platform's. */
export async function resolveCredential(
  credentials: CredentialSource,
  ref: string,
  scope: { workspaceRef?: string }
): Promise<ResolvedCredential | undefined> {
  if (credentials instanceof LayeredCredentials)
    return credentials.resolve(ref, scope);
  const key = await credentials.get(ref, scope);
  return key ? { key, source: "platform" } : undefined;
}

/** Adapters whose LLMs speak OpenAI-compatible Chat Completions (moved to @fonoster/community/openai). */
export { OPENAI_COMPATIBLE };

export class LlmResolutionError extends Error {}

export type ResolvedLlm = {
  think: Think;
  /** The id actually used (a retired id resolves to its replacement). */
  id: string;
  /** Whose key the model is called with; keyless providers count as the platform's. */
  keySource: "workspace" | "platform";
  /** For the call record: provider.deprecated_used / provider.retired_used (registry PR4). */
  event?: { type: string; id: string; replacement?: string };
};

export interface LlmResolver {
  resolve(
    catalogId: string,
    options: { temperature: number; maxTokens: number },
    scope: { workspaceRef?: string }
  ): Promise<ResolvedLlm>;
}

export type RegistryLlmResolverOptions = {
  registry: Registry.Registry;
  credentials: CredentialSource;
  /** Endpoint overrides by provider or adapter id (e.g. a local ollama); win over the catalog's. */
  endpoints?: Record<string, string>;
};

export class RegistryLlmResolver implements LlmResolver {
  constructor(private readonly options: RegistryLlmResolverOptions) {}

  async resolve(
    catalogId: string,
    settings: { temperature: number; maxTokens: number },
    scope: { workspaceRef?: string } = {}
  ): Promise<ResolvedLlm> {
    const { registry } = this.options;
    const resolution = registry.resolve(catalogId);
    const id = resolution.id;
    const entries = registry.list();
    const model = entries.find((e) => e.id === id);
    if (!model || model.kind !== "model" || model.type !== "llm")
      throw new LlmResolutionError(
        `${catalogId} is not a language model in the catalog`
      );
    const providerId = id.slice(0, id.indexOf("/"));
    const provider = entries.find((e) => e.id === providerId);
    if (!provider || provider.kind !== "provider")
      throw new LlmResolutionError(`no provider ${providerId} for ${id}`);
    if (provider.state === "retired")
      throw new LlmResolutionError(`provider ${providerId} is retired`);
    const llm = adapterFor(provider.adapter)?.llm;
    if (!llm)
      throw new LlmResolutionError(
        `adapter ${provider.adapter} has no language model implementation in Autopilot yet`
      );
    const baseUrl =
      this.options.endpoints?.[provider.id] ??
      this.options.endpoints?.[provider.adapter] ??
      provider.endpoints?.llm ??
      llm.defaultEndpoint;
    if (!baseUrl)
      throw new LlmResolutionError(
        `no endpoint for provider ${provider.id} (adapter ${provider.adapter})`
      );
    // A provider without a credentialRef is keyless (local models, the fakes).
    const credential = provider.credentialRef
      ? await resolveCredential(
          this.options.credentials,
          provider.credentialRef,
          scope
        )
      : undefined;
    const apiKey = credential?.key;
    if (provider.credentialRef && !apiKey)
      throw new LlmResolutionError(
        `no credential ${provider.credentialRef} for provider ${provider.id}`
      );
    return {
      id,
      keySource: credential?.source ?? "platform",
      think: llm.create(
        // The catalog provider (e.g. together) names a rejected key, not the adapter (openai).
        { baseUrl, apiKey, name: provider.id },
        id.slice(providerId.length + 1),
        model.features.includes("reasoning")
          ? { ...settings, reasoning: true }
          : settings
      ),
      ...(resolution.event
        ? {
            event: {
              type: resolution.event,
              id: catalogId,
              replacement: resolution.replacement
            }
          }
        : {})
    };
  }
}
