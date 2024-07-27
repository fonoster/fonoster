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
import { BaseApiObject } from "./common";

type AclExtended = {
  ref: string;
  name: string;
  allow: string[];
  deny: string[];
  extended?: Record<string, unknown>;
  // FIXME: Should be a Date
  createdAt?: number;
  updatedAt?: number;
};

type CreateAclRequestExtended = {
  name: string;
  allow: string[];
  deny: string[];
  extended: {
    accessKeyId: string;
  };
};

type UpdateAclRequest = BaseApiObject &
  Omit<Partial<CreateAclRequestExtended>, "extended">;

type ListAclsRequest = {
  pageSize: number;
  pageToken: string;
};

type ListAclsResponse = {
  items: Acl[];
  nextPageToken: string;
};

type Acl = Omit<AclExtended, "extended">;

type CreateAclRequest = Omit<CreateAclRequestExtended, "extended">;

// TODO: Rename ACL to Acl upstream
type AclsApi = {
  createACL(request: CreateAclRequestExtended): Promise<BaseApiObject>;
  updateACL(request: UpdateAclRequest): Promise<BaseApiObject>;
  getACL(ref: string): Promise<AclExtended>;
  deleteACL(ref: string): Promise<void>;
  listACLs(request: ListAclsRequest): Promise<ListAclsResponse>;
};

export {
  Acl,
  AclExtended,
  CreateAclRequest,
  CreateAclRequestExtended,
  UpdateAclRequest,
  ListAclsRequest,
  ListAclsResponse,
  AclsApi
};
