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

type ACL = {
  ref: string;
  name: string;
  allow: string[];
  deny: string[];
  extended?: JsonObject;
  // FIXME: Should be a Date
  createdAt?: number;
  updatedAt?: number;
};

type CreateACLRequest = {
  name: string;
  allow: string[];
  deny: string[];
  extended: {
    accessKeyId: string;
  };
};

type UpdateACLRequest = {
  ref: string;
} & Omit<Partial<CreateACLRequest>, "extended">;

type CreateACLResponse = {
  ref: string;
};

type UpdateACLResponse = {
  ref: string;
};

type GetACLRequest = {
  ref: string;
};

type DeleteACLRequest = {
  ref: string;
};

type ListACLsRequest = {
  pageSize: number;
  pageToken: string;
};

type ListACLsResponse = {
  items: ACL[];
  nextPageToken: string;
};

type ACLsAPI = {
  createACL(request: CreateACLRequest): Promise<CreateACLResponse>;
  updateACL(request: UpdateACLRequest): Promise<UpdateACLResponse>;
  getACL(ref: string): Promise<ACL>;
  deleteACL(ref: string): Promise<void>;
  listACLs(request: ListACLsRequest): Promise<ListACLsResponse>;
};

export {
  ACL,
  CreateACLRequest,
  UpdateACLRequest,
  CreateACLResponse,
  UpdateACLResponse,
  GetACLRequest,
  DeleteACLRequest,
  ListACLsRequest,
  ListACLsResponse,
  ACLsAPI
};
