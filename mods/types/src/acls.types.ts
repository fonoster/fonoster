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
import { BaseApiObject, ListRequest, ListResponse } from "./common";
import { Flatten, RenameAndConvertToTimestamp } from "./utils";

type Acl = {
  ref: string;
  name: string;
  allow: string[];
  createdAt: Date;
  updatedAt: Date;
};

type AclExtended = RenameAndConvertToTimestamp<Acl> & {
  extended?: Record<string, unknown>;
};

type CreateAclRequest = {
  name: string;
  allow: string[];
};

type CreateAclRequestExtended = CreateAclRequest & {
  deny: string[];
  extended?: Record<string, unknown>;
};

type UpdateAclRequest = Flatten<BaseApiObject & Partial<CreateAclRequest>> & {
  deny: string[];
};

type ListAclsRequest = ListRequest;

type ListAclsResponse = ListResponse<Acl>;

type ListAclsResponseExtended = ListResponse<AclExtended>;

type AclsApi = {
  createAcl(request: CreateAclRequestExtended): Promise<BaseApiObject>;
  updateAcl(request: UpdateAclRequest): Promise<BaseApiObject>;
  getAcl(ref: string): Promise<AclExtended>;
  deleteAcl(ref: string): Promise<void>;
  listAcls(request: ListAclsRequest): Promise<ListAclsResponseExtended>;
};

export {
  Acl,
  AclExtended,
  AclsApi,
  CreateAclRequest,
  CreateAclRequestExtended,
  ListAclsRequest,
  ListAclsResponse,
  UpdateAclRequest
};
