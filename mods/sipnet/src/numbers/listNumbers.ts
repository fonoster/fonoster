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
import {
  INumber,
  INumberExtended,
  ListNumbersRequest,
  ListNumbersResponse,
  NumbersApi
} from "@fonoster/types";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import {
  filterByAccessKeyId,
  paginateWithFiltering
} from "../resources/paginationUtils";
import { convertToFonosterNumber } from "./convertToFonosterNumber";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function listNumbers(api: NumbersApi) {
  const fn = async (
    call: { request: ListNumbersRequest },
    callback: (error?: GrpcErrorMessage, response?: ListNumbersResponse) => void
  ) => {
    const { request } = call;

    logger.verbose("call to listNumbers", { ...request });

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );

    const requestWithPageToken = request as {
      pageToken?: string;
      pageSize?: number;
    };
    const pageSize = requestWithPageToken.pageSize || 20;

    const response = await paginateWithFiltering<INumberExtended, INumber>({
      pageSize,
      pageToken: requestWithPageToken.pageToken,
      fetchPage: async (pageToken, fetchPageSize) => {
        const normalizedRequest = {
          ...request,
          pageToken,
          pageSize: fetchPageSize
        };
        return await api.listNumbers(normalizedRequest);
      },
      filterItems: (items: INumberExtended[]): INumber[] => {
        // Filter by accessKeyId and convert to Fonoster number format
        return filterByAccessKeyId(items, accessKeyId).map(
          convertToFonosterNumber
        );
      }
    });

    callback(null, response);
  };

  return withErrorHandlingAndValidation(fn, V.listRequestSchema);
}

export { listNumbers };
