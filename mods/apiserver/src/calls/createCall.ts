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
import { BaseApiObject, GrpcErrorMessage, handleError } from "@fonoster/common";
import { getAccessKeyIdFromCall } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { CreateCallRequest } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { CallPublisher } from "./types";
import { Prisma } from "../core/db";
import { notFoundError } from "../core/notFoundError";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const CreateCallRequestSchema = z.object({
  from: z.string(),
  to: z.string(),
  appRef: z.string(),
  timeout: z.number().optional()
});

function createCall(prisma: Prisma, publisher: CallPublisher) {
  return async (
    call: {
      request: CreateCallRequest;
    },
    callback: (error?: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    try {
      const { from, to, appRef, timeout } = call.request;

      const ref = uuidv4();

      logger.verbose("call to createCall", { ...call.request, ref });

      CreateCallRequestSchema.parse(call.request);

      const accessKeyId = getAccessKeyIdFromCall(
        call as unknown as ServerInterceptingCall
      );

      const app = await prisma.application.findUnique({
        where: { ref: appRef, accessKeyId }
      });

      if (!app) {
        throw notFoundError(`Application with ref ${appRef} not found`);
      }

      // TODO: Must validate that the from number exists and is owned by the user

      publisher.publishCall({
        ref,
        from,
        to,
        appRef,
        accessKeyId,
        timeout: timeout || 60
      });

      callback(null, { ref });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { createCall };
