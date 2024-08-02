/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { Acl } from "./acls.types";
import { BaseApiObject, ListRequest, ListResponse } from "./common";
import { CredentialsExtended } from "./credentials.types";
import { Flatten } from "./utils";

enum Transport {
  UDP = "UDP",
  TCP = "TCP",
  TLS = "TLS",
  SCTP = "SCTP",
  WS = "WS",
  WSS = "WSS"
}

type TrunkURI = {
  host: string;
  port: number;
  transport: Transport;
  user: string;
  weight: number;
  priority: number;
  enabled: boolean;
};

type Trunk = {
  ref: string;
  name: string;
  sendRegister: boolean;
  inboundUri?: string;
  accessControlListRef?: string;
  inboundCredentialsRef?: string;
  outboundCredentialsRef?: string;
  uris?: TrunkURI[];
  createdAt: Date;
  updatedAt: Date;
};

type TrunkExtended = Trunk & {
  accessControlList?: Acl;
  inboundCredentials?: CredentialsExtended;
  outboundCredentials?: CredentialsExtended;
  extended?: Record<string, unknown>;
};

type CreateTrunkRequest = {
  name: string;
  sendRegister: boolean;
  inboundUri: string;
  accessControlListRef?: string;
  inboundCredentialsRef?: string;
  outboundCredentialsRef?: string;
  uris?: TrunkURI[];
};

type CreateTrunkRequestExtended = CreateTrunkRequest & {
  extended?: Record<string, unknown>;
};

type UpdateTrunkRequest = Flatten<BaseApiObject & Partial<CreateTrunkRequest>>;

type ListTrunksRequest = ListRequest;

type ListTrunksResponse = ListResponse<Trunk>;

type TrunkApi = {
  createTrunk(request: CreateTrunkRequest): Promise<BaseApiObject>;
  updateTrunk(request: UpdateTrunkRequest): Promise<BaseApiObject>;
  getTrunk(ref: string): Promise<Trunk>;
  deleteTrunk(ref: string): Promise<void>;
  listTrunks(request: ListTrunksRequest): Promise<ListTrunksResponse>;
};

export {
  Trunk,
  TrunkExtended,
  CreateTrunkRequest,
  CreateTrunkRequestExtended,
  UpdateTrunkRequest,
  ListTrunksRequest,
  ListTrunksResponse,
  TrunkApi
};
