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
import { AclExtended } from "./acls.types";
import { BaseApiObject, ListRequest, ListResponse } from "./common";
import { CredentialsExtended } from "./credentials.types";
import { Flatten, RenameAndConvertToTimestamp } from "./utils";

enum Transport {
  UDP = "UDP",
  TCP = "TCP",
  TLS = "TLS",
  SCTP = "SCTP",
  WS = "WS",
  WSS = "WSS"
}

/** How a number is written on outbound calls to the carrier. */
enum NumberFormat {
  /** As routed (leave as is). */
  NUMBER_FORMAT_UNSPECIFIED = "NUMBER_FORMAT_UNSPECIFIED",
  /** +442079460018 */
  E164 = "E164",
  /** 442079460018 */
  E164_WITHOUT_PLUS = "E164_WITHOUT_PLUS",
  /** 02079460018; a number of another country in international form. */
  NATIONAL = "NATIONAL",
  /** 00442079460018: the international prefix of the Number's country. */
  INTERNATIONAL = "INTERNATIONAL"
}

/** A Trunk's outbound number formats; a prefix (digits, * and #) needs E164_WITHOUT_PLUS, NATIONAL or INTERNATIONAL. */
type TrunkNumberFormats = {
  calledNumberFormat?: `${NumberFormat}`;
  calledNumberPrefix?: string;
  callerNumberFormat?: `${NumberFormat}`;
  callerNumberPrefix?: string;
};

type TrunkURI = {
  host: string;
  port: number;
  transport: `${Transport}`;
  user?: string;
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
} & TrunkNumberFormats;

type TrunkExtended = RenameAndConvertToTimestamp<Trunk> & {
  accessControlList?: AclExtended;
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
} & TrunkNumberFormats;

type CreateTrunkRequestExtended = CreateTrunkRequest & {
  extended?: Record<string, unknown>;
};

type UpdateTrunkRequest = Flatten<BaseApiObject & Partial<CreateTrunkRequest>>;

type ListTrunksRequest = ListRequest;

type ListTrunksResponse = ListResponse<Trunk>;

type ListTrunksResponseExtended = ListResponse<TrunkExtended>;

type TrunkApi = {
  createTrunk(request: CreateTrunkRequest): Promise<BaseApiObject>;
  updateTrunk(request: UpdateTrunkRequest): Promise<BaseApiObject>;
  getTrunk(ref: string): Promise<TrunkExtended>;
  deleteTrunk(ref: string): Promise<void>;
  listTrunks(request: ListTrunksRequest): Promise<ListTrunksResponseExtended>;
};

export {
  CreateTrunkRequest,
  CreateTrunkRequestExtended,
  ListTrunksRequest,
  ListTrunksResponse,
  NumberFormat,
  Transport,
  Trunk,
  TrunkApi,
  TrunkExtended,
  TrunkNumberFormats,
  UpdateTrunkRequest
};
