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
import { getLogger } from "@fonoster/logger";
import { NumbersApi, UpdateNumberResponse } from "./client";
import { FUpdateNumberRequest } from "./types";
import { updateNumberRequestSchema } from "./validation";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function updateNumber(
  api: NumbersApi,
  checkNumberPreconditions: NumberPreconditionsCheck
) {
  return async (
    call: { request: FUpdateNumberRequest },
    callback: (
      error?: GrpcErrorMessage,
      response?: UpdateNumberResponse
    ) => void
  ) => {
    const { request } = call;

    try {
      updateNumberRequestSchema.parse(request);

      // Validates that the appRef or agentAor exists in the system
      await checkNumberPreconditions(request);

      logger.verbose("call to updateNumber", { request });

      const response = await api.updateNumber(request);

      callback(null, response);
    } catch (e) {
      handleError(e, callback);
    }
  };
}

export { updateNumber };
