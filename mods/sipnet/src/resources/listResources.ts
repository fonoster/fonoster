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
import { GrpcErrorMessage, withErrorHandling } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";

const logger = getLogger({ service: "sipnet", filePath: __filename });

type ListResourcesResponse<T> = {
  nextPageToken?: string;
  items: T[];
};

function listResources<T, R, U>(api: U, resource: string) {
  const fn = async (
    call: { request: R },
    callback: (
      error?: GrpcErrorMessage,
      response?: ListResourcesResponse<T>
    ) => void
  ) => {
    const { request } = call;

    const res = resource === "Credentials" ? "Credential" : resource;

    logger.verbose(`call to list${res}s`, { request });

    const response = await api[`list${res}s`](request);
    callback(null, {
      items: response.items,
      nextPageToken: response.nextPageToken
    });
  };

  return withErrorHandling(fn);
}

export { listResources };
