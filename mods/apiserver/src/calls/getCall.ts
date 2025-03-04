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
import {
  getAccessKeyIdFromCall,
  GrpcErrorMessage,
  InfluxDBClient,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { CallDetailRecord } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { notFoundError } from "../core/notFoundError";
import { createFetchSingleCall } from "./createFetchSingleCall";
import { GetCallRequest } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

function getCall(influx: InfluxDBClient) {
  const fetchSingleCall = createFetchSingleCall(influx);

  const fn = async (
    call: {
      request: GetCallRequest;
    },
    callback: (error?: GrpcErrorMessage, response?: CallDetailRecord) => void
  ) => {
    const { ref } = call.request;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    logger.verbose("call to getCall", { accessKeyId, ref });

    const response = await fetchSingleCall(accessKeyId, ref);

    if (!response) {
      throw notFoundError(`Call not found: ${ref}`);
    }

    callback(null, response);
  };

  return withErrorHandlingAndValidation(fn, V.getCallRequestSchema);
}

export { getCall };
