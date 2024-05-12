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
import { createGetFnUtil } from "./createGetFnUtil";
import { UpdateSecretRequest } from "./types";
import { Prisma } from "../db";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function updateSecret(prisma: Prisma) {
  const getFn = createGetFnUtil(prisma);

  return withAccess(
    async (call: { request: UpdateSecretRequest }) => {
      const { name, secret } = call.request;

      const accessKeyId = getAccessKeyIdFromCall(
        call as unknown as ServerInterceptingCall
      );

      logger.verbose("call to updateSecret", {
        accessKeyId
      });

      await prisma.secret.update({
        where: { ref: call.request.ref },
        data: {
          name,
          secret
        }
      });

      return { ref: call.request.ref };
    },
    (ref: string) => getFn(ref)
  );
}

export { updateSecret };
