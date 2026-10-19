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
// The provider registry (add-provider-registry): providers, models and voices by catalog id,
// with a manual lifecycle. The catalog never holds a secret: providers name a credentialRef.

export type Lifecycle = "active" | "deprecated" | "retired";
export type Capability = "stt" | "tts" | "llm";
export type ItemKind = "provider" | "model" | "voice";

/** Where a provider serves each capability; services use these unless their config overrides. */
export type ProviderEndpoints = Partial<Record<Capability, string>>;

export type ProviderEntry = {
  kind: "provider";
  id: string;
  /** A display name ("Deepgram"); the dashboard shows the id without one. */
  label?: string;
  adapter: string;
  capabilities: Capability[];
  /** The platform credential's name; omitted for a keyless provider (no key needed). */
  credentialRef?: string;
  endpoints?: ProviderEndpoints;
  state: Lifecycle;
  replacement?: string;
  retireOn?: string;
};

export type ModelEntry = {
  kind: "model";
  id: string;
  /** A display name ("Nova 3"); the dashboard shows the id without one. */
  label?: string;
  type: Capability;
  features: string[];
  languages: string[];
  /** Settings the model accepts (for example "style", "stability"). */
  settings: string[];
  state: Lifecycle;
  replacement?: string;
  retireOn?: string;
};

export type VoiceEntry = {
  kind: "voice";
  id: string;
  /** A display name ("Aura 2 Thalia"); the dashboard shows the id without one. */
  label?: string;
  models: string[];
  language?: string;
  gender?: string;
  /** Set for a workspace's own (cloned) voice. */
  ownerWorkspace?: string;
  state: Lifecycle;
  replacement?: string;
  retireOn?: string;
};

export type CatalogEntry = ProviderEntry | ModelEntry | VoiceEntry;

export type AuditEntry = {
  at: string;
  actor: string;
  action: string;
  target: string;
  details?: Record<string, unknown>;
};

/** One place a catalog id is used: an app's speech config or an assistant's model config. */
export type Usage = {
  workspace: string;
  config: { kind: "app" | "assistant"; ref: string; name: string };
  model?: string;
  voice?: string;
  /** Settings the config sets on the model (dropped when the replacement does not accept them). */
  settings: string[];
  /** Hard features the config needs (derived from its content, e.g. tools need tool-calling). */
  requires: string[];
};

/** Where usages come from (apps and assistants in the control-plane database). */
export interface UsageSource {
  find(id: string): Usage[];
  /** Rewrites one config; returns false if it changed since it was read. */
  rewrite(
    usage: Usage,
    change: { model?: string; voice?: string; dropSettings: string[] }
  ): boolean;
  /** Tells a workspace about a change (dashboard notice). */
  notify(workspace: string, notice: Record<string, unknown>): void;
}

/** Where the catalog and the audit log are kept. */
export interface RegistryStore {
  all(): CatalogEntry[];
  get(id: string): CatalogEntry | undefined;
  put(entry: CatalogEntry): void;
  audit(entry: AuditEntry): void;
  history(id?: string): AuditEntry[];
}
