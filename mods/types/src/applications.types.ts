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
import { Flatten } from "./utils";

enum ApplicationType {
  EXTERNAL = "EXTERNAL",
  AUTOPILOT = "AUTOPILOT"
}

type Application = {
  ref: string;
  name: string;
  type: ApplicationType;
  endpoint?: string;
  textToSpeech?: {
    productRef: string;
    config: Record<string, unknown>;
  };
  speechToText?: {
    productRef: string;
    config: Record<string, unknown>;
  };
  intelligence?: {
    productRef: string;
    config: Record<string, unknown>;
  };
  createdAt: Date;
  updatedAt: Date;
};

type CreateApplicationRequest = {
  name: string;
  type: ApplicationType;
  endpoint?: string;
  textToSpeech?: {
    productRef: string;
    config: Record<string, unknown>;
  };
  speechToText?: {
    productRef: string;
    config: Record<string, unknown>;
  };
  intelligence?: {
    productRef: string;
    credentials: Record<string, unknown>;
    config: Record<string, unknown>;
  };
};

type UpdateApplicationRequest = Flatten<
  BaseApiObject & Partial<CreateApplicationRequest>
>;

type ListApplicationsRequest = ListRequest;

type ListApplicationsResponse = ListResponse<Application>;

export {
  Application,
  ApplicationType,
  CreateApplicationRequest,
  ListApplicationsRequest,
  ListApplicationsResponse,
  UpdateApplicationRequest
};
