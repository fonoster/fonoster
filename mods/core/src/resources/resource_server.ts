/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import grpc from "@grpc/grpc-js";
import { Kind } from "../common/resource_builder";
import getResourceHere from "./get_resource";
import listResourcesHere from "./list_resources";
import deleteResourceHere from "./delete_resource";
import getAccessKeyId from "../common/get_access_key_id";
import { ListResourceResponse } from "./types";
import logger from "@fonoster/logger";

export default class ResourceServer {
  static async listResources(
    kind: Kind,
    call: grpc.ServerUnaryCall<any, ListResourceResponse>
  ): Promise<ListResourceResponse> {
    try {
      return await listResourcesHere({
        accessKeyId: getAccessKeyId(call),
        kind,
        page: parseInt(call.request.getPageToken()),
        itemsPerPage: call.request.getPageSize()
      });
    } catch (e) {
      logger.error(e);
      return null;
    }
  }

  static async getResource(
    kind: Kind,
    call: grpc.ServerUnaryCall<any, unknown>
  ): Promise<unknown> {
    try {
      return getResourceHere({
        ref: call.request.getRef(),
        kind,
        accessKeyId: getAccessKeyId(call)
      });
    } catch (e) {
      logger.error(e);
      return null;
    }
  }

  static async deleteResource(
    kind: Kind,
    call: grpc.ServerUnaryCall<any, any>
  ) {
    await deleteResourceHere({
      ref: call.request.getRef(),
      kind,
      accessKeyId: getAccessKeyId(call)
    });
  }
}
