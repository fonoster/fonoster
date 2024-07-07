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
import { GrpcErrorMessage, handleError } from "@fonoster/common";
import { getAccessKeyIdFromCall } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { CallPublisher, CreateCallRequest, CreateCallResponse } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const CreateCallRequestSchema = z.object({
  from: z.string(),
  to: z.string(),
  appRef: z.string()
});

function createCall(publisher: CallPublisher) {
  return async (
    call: {
      request: CreateCallRequest;
    },
    callback: (error?: GrpcErrorMessage, response?: CreateCallResponse) => void
  ) => {
    try {
      const { from, to, appRef } = call.request;

      CreateCallRequestSchema.parse(call.request);

      const ref = uuidv4();

      const accessKeyId = getAccessKeyIdFromCall(
        call as unknown as ServerInterceptingCall
      );

      logger.verbose("call to createCall", {
        accessKeyId,
        ref,
        from,
        to,
        appRef
      });

      publisher.publishCall({ ref, from, to, appRef });

      callback(null, { ref });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { createCall };
