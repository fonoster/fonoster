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
  GrpcErrorMessage,
  NumberPreconditionsCheck,
  handleError
} from "@fonoster/common";
import { getAccessKeyIdFromCall } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { CreateNumberResponse, NumbersApi } from "./client";
import { convertToRoutrNumber } from "./convertToRoutrNumber";
import { FCreateNumberRequest } from "./types";
import { createNumberRequestSchema } from "./validation";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function createNumber(
  api: NumbersApi,
  checkNumberPreconditions: NumberPreconditionsCheck
) {
  return async (
    call: { request: FCreateNumberRequest },
    callback: (
      error?: GrpcErrorMessage,
      response?: CreateNumberResponse
    ) => void
  ) => {
    const { request } = call;

    try {
      createNumberRequestSchema.parse(request);

      // Validates that the appRef or agentAor exists in the system
      await checkNumberPreconditions(request);

      const accessKeyId = getAccessKeyIdFromCall(
        call as unknown as ServerInterceptingCall
      );

      logger.verbose("call to createNumber", { request, accessKeyId });

      const response = await api.createNumber(
        convertToRoutrNumber(request, accessKeyId)
      );

      callback(null, response);
    } catch (e) {
      handleError(e, callback);
    }
  };
}

export { createNumber };
