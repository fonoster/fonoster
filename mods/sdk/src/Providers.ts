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
import {
  CatalogItem,
  CatalogWarning,
  ListCatalogRequest,
  ListCatalogResponse,
  ListProviderKeysResponse,
  ListWarningsResponse,
  ProviderKey,
  SetProviderKeyRequest
} from "@fonoster/types";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CatalogItem as CatalogItemPB,
  DeleteProviderKeyRequest as DeleteProviderKeyRequestPB,
  DeleteProviderKeyResponse as DeleteProviderKeyResponsePB,
  ListCatalogRequest as ListCatalogRequestPB,
  ListCatalogResponse as ListCatalogResponsePB,
  ListProviderKeysRequest as ListProviderKeysRequestPB,
  ListProviderKeysResponse as ListProviderKeysResponsePB,
  ListWarningsRequest as ListWarningsRequestPB,
  ListWarningsResponse as ListWarningsResponsePB,
  ProviderKey as ProviderKeyPB,
  SetProviderKeyRequest as SetProviderKeyRequestPB,
  Warning as WarningPB
} from "./generated/node/providers_pb";

type Raw = Record<string, unknown>;

/** Repeated fields come back as `xList` when empty; normalize them and drop empty strings. */
function toItem(raw: Raw): CatalogItem {
  const out: Raw = {};
  for (const [key, value] of Object.entries(raw)) {
    const name = key.endsWith("List") ? key.slice(0, -4) : key;
    if (value === "") continue;
    out[name] = value;
  }
  for (const list of ["capabilities", "languages", "features", "models"])
    out[list] ??= [];
  return out as unknown as CatalogItem;
}

/**
 * @classdesc The provider catalog (read-only) and the workspace's own vendor keys. Catalog ids
 * (`<provider>/<model-or-voice>`) are what apps use for speech defaults. A key is stored in a
 * write-only Secret and never read back.
 *
 * @example
 * const providers = new SDK.Providers(client);
 * const { items } = await providers.listCatalog({ kind: "voice" });
 * await providers.setProviderKey({ providerId: "deepgram", key: "dg-..." });
 */
class Providers {
  private readonly client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  /** Providers, models and voices this workspace can use (not retired). */
  async listCatalog(
    request: ListCatalogRequest = {}
  ): Promise<ListCatalogResponse> {
    const client = this.client.getProvidersClient();
    const raw = await makeRpcRequest<
      ListCatalogRequestPB,
      ListCatalogResponsePB,
      ListCatalogRequest,
      { items?: Raw[] }
    >({
      method: client.listCatalog.bind(client),
      requestPBObjectConstructor: ListCatalogRequestPB,
      metadata: this.client.getMetadata(),
      request,
      repeatableObjectMapping: [["itemsList", CatalogItemPB]]
    });
    return { items: (raw.items ?? []).map(toItem) };
  }

  /** Stores or replaces the workspace's key for a provider. */
  async setProviderKey(request: SetProviderKeyRequest): Promise<ProviderKey> {
    const client = this.client.getProvidersClient();
    return await makeRpcRequest<
      SetProviderKeyRequestPB,
      ProviderKeyPB,
      SetProviderKeyRequest,
      ProviderKey
    >({
      method: client.setProviderKey.bind(client),
      requestPBObjectConstructor: SetProviderKeyRequestPB,
      metadata: this.client.getMetadata(),
      request
    });
  }

  async listProviderKeys(): Promise<ListProviderKeysResponse> {
    const client = this.client.getProvidersClient();
    const raw = await makeRpcRequest<
      ListProviderKeysRequestPB,
      ListProviderKeysResponsePB,
      Record<string, never>,
      { items?: ProviderKey[] }
    >({
      method: client.listProviderKeys.bind(client),
      requestPBObjectConstructor: ListProviderKeysRequestPB,
      metadata: this.client.getMetadata(),
      request: {},
      repeatableObjectMapping: [["itemsList", ProviderKeyPB]]
    });
    return { items: raw.items ?? [] };
  }

  /**
   * Deprecated or retired catalog items this workspace uses, with the saved configs that name
   * them and the apps whose sessions used them lately (the dashboard's warnings).
   */
  async listWarnings(): Promise<ListWarningsResponse> {
    const client = this.client.getProvidersClient();
    const raw = await makeRpcRequest<
      ListWarningsRequestPB,
      ListWarningsResponsePB,
      Record<string, never>,
      { items?: Raw[] }
    >({
      method: client.listWarnings.bind(client),
      requestPBObjectConstructor: ListWarningsRequestPB,
      metadata: this.client.getMetadata(),
      request: {},
      repeatableObjectMapping: [["itemsList", WarningPB]]
    });
    return {
      items: (raw.items ?? []).map((w) => {
        const out: Raw = {};
        for (const [key, value] of Object.entries(w)) {
          const name = key.endsWith("List") ? key.slice(0, -4) : key;
          if (value === "") continue;
          out[name] = value;
        }
        out.usedBy ??= [];
        out.runtimeApps ??= [];
        out.runtimeSessions ??= 0;
        return out as unknown as CatalogWarning;
      })
    };
  }

  /** Removes the workspace's key for a provider (the platform key applies again). */
  async deleteProviderKey(providerId: string): Promise<{ providerId: string }> {
    const client = this.client.getProvidersClient();
    return await makeRpcRequest<
      DeleteProviderKeyRequestPB,
      DeleteProviderKeyResponsePB,
      { providerId: string },
      { providerId: string }
    >({
      method: client.deleteProviderKey.bind(client),
      requestPBObjectConstructor: DeleteProviderKeyRequestPB,
      metadata: this.client.getMetadata(),
      request: { providerId }
    });
  }
}

export { Providers };
