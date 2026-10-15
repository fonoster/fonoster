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
/** A catalog entry visible to the workspace (add-provider-registry). */
type CatalogItem = {
  /** Catalog id, e.g. deepgram/nova-3; a provider's id has no slash. */
  id: string;
  kind: "provider" | "model" | "voice";
  state: "active" | "deprecated";
  providerId: string;
  /** Models: stt, tts or llm. */
  type?: "stt" | "tts" | "llm";
  capabilities?: string[];
  languages?: string[];
  features?: string[];
  models?: string[];
  gender?: string;
  replacement?: string;
  retireOn?: string;
};

type ListCatalogRequest = {
  kind?: "provider" | "model" | "voice";
  type?: "stt" | "tts" | "llm";
};

type ListCatalogResponse = { items: CatalogItem[] };

/** A workspace's own vendor key; the key is only in its write-only Secret. */
type ProviderKey = {
  ref: string;
  providerId: string;
  secretRef: string;
  createdAt: Date;
  updatedAt: Date;
};

type SetProviderKeyRequest = { providerId: string; key: string };

type ListProviderKeysResponse = { items: ProviderKey[] };

/** Where a warned item is used in the workspace. */
type WarningUse = {
  kind: "app" | "assistant";
  ref: string;
  name: string;
  /** voice, ttsModel, sttModel or llm */
  field: string;
  /** For a TTS model: the voice the config uses with it. */
  voice?: string;
};

/** A deprecated or retired catalog item the workspace uses (dashboard warnings). */
type CatalogWarning = {
  id: string;
  kind: "provider" | "model" | "voice";
  state: "deprecated" | "retired";
  replacement?: string;
  retireOn?: string;
  usedBy: WarningUse[];
  runtimeApps: string[];
  runtimeSessions: number;
  lastUsedAt?: string;
};

type ListWarningsResponse = { items: CatalogWarning[] };

export {
  CatalogWarning,
  ListWarningsResponse,
  WarningUse,
  CatalogItem,
  ListCatalogRequest,
  ListCatalogResponse,
  ListProviderKeysResponse,
  ProviderKey,
  SetProviderKeyRequest
};
