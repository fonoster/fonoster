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
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ListCallsRequest, ListCallsResponse } from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** Call history from the call-record index (`fetchCalls` is createFetchCallsFromIndex). */
function listCalls(
  fetchCalls: (
    accessKeyId: string,
    request: ListCallsRequest
  ) => Promise<ListCallsResponse>
) {
  const fn = async (
    call: {
      request: ListCallsRequest;
    },
    callback: (error?: GrpcErrorMessage, response?: ListCallsResponse) => void
  ) => {
    const { request } = call;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    logger.verbose("call to listCalls", { request, accessKeyId });

    const result = await fetchCalls(accessKeyId, request);

    callback(null, result);
  };

  return withErrorHandlingAndValidation(fn, V.listCallsRequestSchema);
}

export { listCalls };
