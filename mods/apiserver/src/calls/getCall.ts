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
import { GRPCError, handleError } from "@fonoster/common";
import { getAccessKeyIdFromCall } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { z } from "zod";
import { createFetchSingleCall } from "./createFetchSingleCall";
import { CallDetailRecord, GetCallRequest, InfluxDBClient } from "./types";
import { notFoundError } from "../core/notFoundError";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const GetCallRequestSchema = z.object({
  ref: z.string({ message: "Invalid call reference" })
});

function getCall(influx: InfluxDBClient) {
  const fetchSingleCall = createFetchSingleCall(influx);

  return async (
    call: {
      request: GetCallRequest;
    },
    callback: (error: GRPCError, response?: CallDetailRecord) => void
  ) => {
    try {
      const { ref } = call.request;

      GetCallRequestSchema.parse({ ref });

      const accessKeyId = getAccessKeyIdFromCall(
        call as unknown as ServerInterceptingCall
      );

      logger.verbose("call to getCall", { accessKeyId, ref });

      const response = await fetchSingleCall(accessKeyId, ref);

      if (!response) {
        throw notFoundError(`Call not found: ${ref}`);
      }

      callback(null, response);
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { getCall };
