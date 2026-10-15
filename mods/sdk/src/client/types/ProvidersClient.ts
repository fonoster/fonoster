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
  DeleteProviderKeyRequest,
  DeleteProviderKeyResponse,
  ListCatalogRequest,
  ListCatalogResponse,
  ListProviderKeysRequest,
  ListProviderKeysResponse,
  ListWarningsRequest,
  ListWarningsResponse,
  ProviderKey,
  SetProviderKeyRequest
} from "../../generated/web/providers_pb";
import { ClientFunction } from "./common";

type ProvidersClient = {
  listCatalog: ClientFunction<ListCatalogRequest, ListCatalogResponse>;
  setProviderKey: ClientFunction<SetProviderKeyRequest, ProviderKey>;
  listProviderKeys: ClientFunction<
    ListProviderKeysRequest,
    ListProviderKeysResponse
  >;
  deleteProviderKey: ClientFunction<
    DeleteProviderKeyRequest,
    DeleteProviderKeyResponse
  >;
  listWarnings: ClientFunction<ListWarningsRequest, ListWarningsResponse>;
};

export { ProvidersClient };
