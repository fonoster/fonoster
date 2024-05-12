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
import { getAccessKeyIdFromCall, withAccess } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function updateResource<T, R, U>(api: U, resource: string) {
  return withAccess(
    async (call: { request: R }): Promise<T> => {
      const { request } = call;

      const accessKeyId = getAccessKeyIdFromCall(
        call as unknown as ServerInterceptingCall
      );

      logger.verbose(`call to update${resource}`, { request });

      return await api[`update${resource}`]({
        ...request,
        // FIXME: We should not have to pass the accessKeyId here. Fix upstream!
        extended: {
          accessKeyId
        }
      });
    },
    (ref: string) => api[`get${resource}`](ref)
  );
}

export { updateResource };
