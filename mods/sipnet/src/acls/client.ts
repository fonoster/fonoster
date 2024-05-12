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
import { JsonObject } from "@prisma/client/runtime/library";

type Acl = {
  ref: string;
  name: string;
  allow: string[];
  deny: string[];
  extended?: JsonObject;
  // FIXME: Should be a Date
  createdAt?: number;
  updatedAt?: number;
};

type CreateAclRequest = {
  name: string;
  allow: string[];
  deny: string[];
  extended: {
    accessKeyId: string;
  };
};

type UpdateAclRequest = {
  ref: string;
} & Omit<Partial<CreateAclRequest>, "extended">;

type CreateAclResponse = {
  ref: string;
};

type UpdateAclResponse = {
  ref: string;
};

type GetAclRequest = {
  ref: string;
};

type DeleteAclRequest = {
  ref: string;
};

type ListAclsRequest = {
  pageSize: number;
  pageToken: string;
};

type ListAclsResponse = {
  items: Acl[];
  nextPageToken: string;
};

// TODO: Rename ACL to Acl upstream
type AclsApi = {
  createACL(request: CreateAclRequest): Promise<CreateAclResponse>;
  updateACL(request: UpdateAclRequest): Promise<UpdateAclResponse>;
  getACL(ref: string): Promise<Acl>;
  deleteACL(ref: string): Promise<void>;
  listACLs(request: ListAclsRequest): Promise<ListAclsResponse>;
};

export {
  Acl,
  CreateAclRequest,
  UpdateAclRequest,
  CreateAclResponse,
  UpdateAclResponse,
  GetAclRequest,
  DeleteAclRequest,
  ListAclsRequest,
  ListAclsResponse,
  AclsApi
};
