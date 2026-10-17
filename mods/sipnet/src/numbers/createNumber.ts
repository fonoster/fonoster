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
  NumberPreconditionsCheck,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import {
  BaseApiObject,
  CreateNumberRequest,
  NumbersApi
} from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { CheckRefs, numberRefs } from "../resources/checkRefs";
import { convertToRoutrNumber } from "./convertToRoutrNumber";
import { NumberRouting } from "./engineRouting";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function createNumber(
  api: NumbersApi,
  checkNumberPreconditions: NumberPreconditionsCheck,
  routing?: NumberRouting,
  checkRefs?: CheckRefs
) {
  const fn = async (
    call: { request: CreateNumberRequest },
    callback: (error?: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    // Validates that the appRef exists in the caller's workspace (RV-B4)
    await checkNumberPreconditions({ ...request, accessKeyId });
    // ...and the trunk too (H7)
    await checkRefs?.(accessKeyId, numberRefs(request));

    logger.verbose("call to createNumber", { ...request, accessKeyId });

    const appPeerAor =
      routing && request.appRef
        ? await routing.aorFor({
            appRef: request.appRef,
            telUrl: request.telUrl
          })
        : undefined;

    const response = await api.createNumber(
      convertToRoutrNumber(request, accessKeyId, appPeerAor)
    );

    callback(null, response);
  };

  return withErrorHandlingAndValidation(fn, V.createNumberRequestSchema);
}

export { createNumber };
