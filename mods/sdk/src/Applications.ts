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
import {
  BaseApiObject,
  CreateApplicationRequest,
  CreateApplicationResponse,
  DeleteApplicationRequest,
  DeleteApplicationResponse,
  GetApplicationRequest,
  ListApplicationsRequest,
  ListApplicationsResponse,
  UpdateApplicationRequest
} from "@fonoster/common";
import { makeRpcRequest } from "./client/makeRpcRequest";
import { FonosterClient } from "./client/types";
import {
  CreateApplicationRequest as CreateApplicationRequestPB,
  CreateApplicationResponse as CreateApplicationResponsePB,
  GetApplicationRequest as GetApplicationRequestPB,
  GetApplicationResponse as GetApplicationResponsePB,
  ListApplicationsRequest as ListApplicationsRequestPB,
  ListApplicationsResponse as ListApplicationsResponsePB,
  UpdateApplicationRequest as UpdateApplicationRequestPB,
  UpdateApplicationResponse as UpdateApplicationResponsePB
} from "./generated/node/applications_pb";
import { ApplicationType } from "./generated/web/applications_pb";

class Applications {
  private client: FonosterClient;

  constructor(client: FonosterClient) {
    this.client = client;
  }

  async createApplication(
    request: CreateApplicationRequest
  ): Promise<CreateApplicationResponse> {
    const applicationsClient = this.client.getApplicationsClient();
    return await makeRpcRequest<
      CreateApplicationRequestPB,
      CreateApplicationResponsePB,
      CreateApplicationRequest,
      CreateApplicationResponse
    >(
      applicationsClient.createApplication.bind(applicationsClient),
      CreateApplicationRequestPB,
      this.client.getMetadata(),
      request,
      [["type", ApplicationType]]
    );
  }

  async getApplication(request: GetApplicationRequest): Promise<BaseApiObject> {
    const applicationsClient = this.client.getApplicationsClient();
    return await makeRpcRequest<
      GetApplicationRequestPB,
      GetApplicationResponsePB,
      GetApplicationRequest,
      BaseApiObject
    >(
      applicationsClient.getApplication.bind(applicationsClient),
      GetApplicationRequestPB,
      this.client.getMetadata(),
      request
    );
  }

  async updateApplication(
    request: UpdateApplicationRequest
  ): Promise<BaseApiObject> {
    const applicationsClient = this.client.getApplicationsClient();
    return await makeRpcRequest<
      UpdateApplicationRequestPB,
      UpdateApplicationResponsePB,
      UpdateApplicationRequest,
      BaseApiObject
    >(
      applicationsClient.updateApplication.bind(applicationsClient),
      UpdateApplicationRequestPB,
      this.client.getMetadata(),
      request
    );
  }

  async listApplications(
    request: ListApplicationsRequest
  ): Promise<ListApplicationsResponse> {
    const applicationsClient = this.client.getApplicationsClient();
    return await makeRpcRequest<
      ListApplicationsRequestPB,
      ListApplicationsResponsePB,
      ListApplicationsRequest,
      ListApplicationsResponse
    >(
      applicationsClient.listApplications.bind(applicationsClient),
      ListApplicationsRequestPB,
      this.client.getMetadata(),
      request
    );
  }

  async deleteApplication(
    request: DeleteApplicationRequest
  ): Promise<DeleteApplicationResponse> {
    const applicationsClient = this.client.getApplicationsClient();
    return await makeRpcRequest<
      GetApplicationRequestPB,
      GetApplicationResponsePB,
      GetApplicationRequest,
      DeleteApplicationResponse
    >(
      applicationsClient.getApplication.bind(applicationsClient),
      GetApplicationRequestPB,
      this.client.getMetadata(),
      request
    );
  }
}

export { Applications };
