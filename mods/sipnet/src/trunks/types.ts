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

type Trunk = Omit<RTypes.Trunk, "extended">;

type CreateTrunkRequest = Omit<RTypes.CreateTrunkRequest, "extended">;

type CreateTrunkResponse = RTypes.CreateTrunkResponse;

type UpdateTrunkRequest = RTypes.UpdateTrunkRequest;

type UpdateTrunkResponse = RTypes.UpdateTrunkResponse;

type GetTrunkRequest = RTypes.GetTrunkRequest;

type ListTrunksRequest = RTypes.ListTrunksRequest;

type ListTrunksResponse = RTypes.ListTrunksResponse;

type DeleteTrunkRequest = RTypes.DeleteTrunkRequest;

type DeleteTrunkResponse = {
  ref: string;
};

export type {
  Trunk,
  CreateTrunkRequest,
  CreateTrunkResponse,
  UpdateTrunkRequest,
  UpdateTrunkResponse,
  GetTrunkRequest,
  ListTrunksRequest,
  ListTrunksResponse,
  DeleteTrunkRequest,
  DeleteTrunkResponse
};
