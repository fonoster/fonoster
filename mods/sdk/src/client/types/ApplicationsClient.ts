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
import { Empty } from "google-protobuf/google/protobuf/empty_pb";
import {
  Application,
  CreateApplicationRequest,
  CreateApplicationResponse,
  DeleteApplicationRequest,
  DeleteApplicationResponse,
  EvaluateIntelligenceRequest,
  EvaluateIntelligenceResponse,
  GetApplicationRequest,
  ListApplicationsRequest,
  ListApplicationsResponse,
  TestTokenResponse,
  UpdateApplicationRequest,
  UpdateApplicationResponse
} from "../../generated/web/applications_pb";
import { ClientFunction } from "./common";

type ApplicationsClient = {
  createApplication: ClientFunction<
    CreateApplicationRequest,
    CreateApplicationResponse
  >;
  getApplication: ClientFunction<GetApplicationRequest, Application>;
  updateApplication: ClientFunction<
    UpdateApplicationRequest,
    UpdateApplicationResponse
  >;
  listApplications: ClientFunction<
    ListApplicationsRequest,
    ListApplicationsResponse
  >;
  deleteApplication: ClientFunction<
    DeleteApplicationRequest,
    DeleteApplicationResponse
  >;
  evaluateIntelligence: ClientFunction<
    EvaluateIntelligenceRequest,
    EvaluateIntelligenceResponse
  >;
  createTestToken: ClientFunction<Empty, TestTokenResponse>;
};

export { ApplicationsClient };
