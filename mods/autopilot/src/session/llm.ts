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
import { OpenAiCompatibleThink, Think } from "./think";

// Language models through the provider registry (rework-autopilot A8, A11, task 3.1; registry
// PR6: Autopilot resolves its own LLM credential, the gateway resolves speech). The assistant
// names a catalog id; the registry says which provider serves it, through which adapter, with
// which credentialRef; a CredentialSource turns the ref into a key. No key lives in the
// assistant config or in Autopilot's environment by name.

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

/** Workspace Secrets (BYOK) in front of platform credentials. */
export class LayeredCredentials implements CredentialSource {
  constructor(private readonly sources: CredentialSource[]) {}

  async get(ref: string, scope: { workspaceRef?: string }) {
    for (const s of this.sources) {
      const v = await s.get(ref, scope);
      if (v) return v;
    }
    return undefined;
  }
}

/** Adapters whose LLMs speak OpenAI-compatible Chat Completions, with their default endpoints. */
export const OPENAI_COMPATIBLE: Record<string, string | undefined> = {
  openai: "https://api.openai.com",
  groq: "https://api.groq.com/openai",
  ollama: "http://localhost:11434",
  fake: undefined
};

export class LlmResolutionError extends Error {}

export type ResolvedLlm = {
  think: Think;
  /** The id actually used (a retired id resolves to its replacement). */
  id: string;
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
  /** Endpoint overrides by adapter or provider id (required for fake; e.g. a local ollama). */
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
    if (!(provider.adapter in OPENAI_COMPATIBLE))
      throw new LlmResolutionError(
        `adapter ${provider.adapter} has no language model implementation in Autopilot yet`
      );
    const baseUrl =
      this.options.endpoints?.[provider.id] ??
      this.options.endpoints?.[provider.adapter] ??
      OPENAI_COMPATIBLE[provider.adapter];
    if (!baseUrl)
      throw new LlmResolutionError(
        `no endpoint for provider ${provider.id} (adapter ${provider.adapter})`
      );
    const apiKey = await this.options.credentials.get(
      provider.credentialRef,
      scope
    );
    if (!apiKey && provider.adapter !== "fake" && provider.adapter !== "ollama")
      throw new LlmResolutionError(
        `no credential ${provider.credentialRef} for provider ${provider.id}`
      );
    return {
      id,
      think: new OpenAiCompatibleThink(
        { baseUrl, apiKey },
        id.slice(providerId.length + 1),
        settings
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
