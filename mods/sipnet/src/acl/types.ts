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
import * as RTypes from "./client";

type ACL = Omit<RTypes.ACL, "extended">;

type CreateACLRequest = Omit<RTypes.CreateACLRequest, "extended">;

type CreateACLResponse = RTypes.CreateACLResponse;

type UpdateACLRequest = RTypes.UpdateACLRequest;

type UpdateACLResponse = RTypes.UpdateACLResponse;

type GetACLRequest = RTypes.GetACLRequest;

type ListACLsRequest = RTypes.ListACLsRequest;

type ListACLsResponse = RTypes.ListACLsResponse;

type DeleteACLRequest = RTypes.DeleteACLRequest;

type DeleteACLResponse = {
  ref: string;
};

export type {
  ACL,
  CreateACLRequest,
  CreateACLResponse,
  UpdateACLRequest,
  UpdateACLResponse,
  GetACLRequest,
  ListACLsRequest,
  ListACLsResponse,
  DeleteACLRequest,
  DeleteACLResponse
};
