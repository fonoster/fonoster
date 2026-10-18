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
  NumberPreconditionsCheck,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { withAccess } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import {
  BaseApiObject,
  NumbersApi,
  UpdateNumberRequest
} from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { CheckRefs, numberRefs } from "../resources/checkRefs";
import { convertToRoutrNumberUpdate } from "./convertToRoutrNumber";
import { NumberRouting } from "./engineRouting";

const logger = getLogger({ service: "sipnet", filePath: __filename });

type OwnedLookup = Parameters<typeof withAccess>[1];

function updateNumber(
  api: NumbersApi,
  checkNumberPreconditions: NumberPreconditionsCheck,
  routing?: NumberRouting,
  checkRefs?: CheckRefs
) {
  const fn = async (call: {
    request: UpdateNumberRequest;
  }): Promise<BaseApiObject> => {
    const { request } = call;

    // Validates that the appRef exists in the caller's workspace (RV-B4)
    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );
    await checkNumberPreconditions({ ...request, accessKeyId });
    // ...and the trunk too (H7)
    await checkRefs?.(accessKeyId, numberRefs(request));

    logger.verbose("call to updateNumber", { ...request });

    // The number's telUrl matters only for per-number pins, so it is read only with routing.
    const appPeerAor =
      routing && request.appRef
        ? await routing.aorFor({
            appRef: request.appRef,
            telUrl: (await api.getNumber(request.ref))?.telUrl
          })
        : undefined;

    return await api.updateNumber(
      convertToRoutrNumberUpdate(request, appPeerAor)
    );
  };

  // Only the caller's own numbers can be updated, like every other resource.
  return withErrorHandlingAndValidation(
    withAccess(fn, ((ref: string) => api.getNumber(ref)) as OwnedLookup),
    V.updateNumberRequestSchema
  );
}

export { updateNumber };
